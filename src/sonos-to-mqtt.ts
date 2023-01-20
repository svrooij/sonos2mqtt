import { SonosManager, SonosEvents, SonosDevice, } from '@svrooij/sonos'
import { AVTransportServiceEvent, RenderingControlServiceEvent } from '@svrooij/sonos/lib/services';
import { PlayMode, TransportState } from '@svrooij/sonos/lib/models';
import  PlayModeHelper from '@svrooij/sonos/lib/helpers/playmode-helper';
import { Config } from './config'
import { StaticLogger } from './static-logger'
import { SmarthomeMqtt } from './smarthome-mqtt';
import { SonosCommandMapping } from './sonos-command-mapping';
import { SonosState } from './sonos-state';
import { SonosCommands } from './sonos-commands';
import { HaAutoDiscovery } from './ha-discovery';

export class SonosToMqtt {
  private readonly sonosManager: SonosManager;
  private readonly mqtt: SmarthomeMqtt;
  private readonly log = StaticLogger.CreateLoggerForSource('Sonos2mqtt.main')
  private readonly states: Array<Partial<SonosState>> = [];
  private readonly positionTimers: {[key: string]: NodeJS.Timeout} = {};
  private readonly stateTimers: {[key: string]: NodeJS.Timeout} = {};
  private previousTvVolume?: number;
  private readonly _soundbarTrackUri = 'x-sonos-htastream:RINCON_'
  constructor(private config: Config) {
    this.sonosManager = new SonosManager();
    this.mqtt = new SmarthomeMqtt(config.mqtt, config.prefix, config.clientid);
  }

  async start(): Promise<boolean> {
    let success: boolean
    if(this.config.device !== undefined) {
      success = await this.sonosManager.InitializeFromDevice(this.config.device);
    } else {
      success = await this.sonosManager.InitializeWithDiscovery(this.config.wait);
    }
    success = success && this.sonosManager.Devices.length > 0;

    if (success) {
      this.log.info('Found {numDevices} sonos speakers', this.sonosManager.Devices.length)
      this.setupMqttEvents()
      this.setupSonosEvents()
      this.mqtt.connect()
      this.mqtt.publishStatus('2');

      if(this.config.discovery === true) {
        this.publishDiscoveryMessages();
      }

      if (this.config.tvGroup !== undefined && this.config.tvUuid !== undefined) {
        if (this.sonosManager.Devices.some(d => d.Uuid === this.config.tvGroup) && this.sonosManager.Devices.some(d => d.Uuid === this.config.tvUuid)) {
          this.setupTvMonitoring(this.config.tvUuid, this.config.tvGroup);
        }
      }

    }
    return success;
  }

  stop(): void {
    this.mqtt.publishStatus('1');
    this.mqtt.close();
    this.sonosManager.Devices.forEach(d => {
      d.CancelEvents()
    })
  }

  /**
   * Will setup all events from mqtt with the correct handler.
   */
  private setupMqttEvents(): void {
    this.log.debug('Setting up mqtt events')
    this.mqtt.Events.on('connected', (connected) => {
      this.log.info('Mqtt connection changed to connected: {connected}', connected)
    })

    this.mqtt.Events.on('generic', async (command, payload) => {
      this.log.debug('Got generic command {command} from mqtt', command)
      switch (command) {
        case 'notify':
          return this.sonosManager.PlayNotification(payload);

        case 'speak':
          return this.sonosManager.PlayTTS(payload);

        case 'pauseall':
          return Promise.all(this.sonosManager.Devices
            .filter(d => d.Coordinator.Uuid === d.Uuid)
            .map(d => d.Pause().catch(err =>{
              this.log.warn('Device %s emitted an error %o', d.Uuid, err);
            })));
        
        case 'listalarm': // This typ-o is still there for backward compatibility 
        case 'listalarms':
          const alarms = await this.sonosManager.Devices[0].AlarmClockService.ListAndParseAlarms()
          this.mqtt.publish('alarms', alarms);
          break;

        case 'setalarm':
          return this.sonosManager.Devices[0].AlarmClockService.PatchAlarm(payload);

        case 'setlogging':
          return StaticLogger.setLevel(payload);

        case 'check-subscriptions':
          return this.sonosManager.CheckAllEventSubscriptions();
      }
    })

    this.mqtt.Events.on('deviceControl', async (uuid, payload)=> {
      const correctDevice = this.sonosManager.Devices.find(d => d.Uuid.toLocaleLowerCase() === uuid || SonosToMqtt.CleanName(d.Name) === uuid);
      if(correctDevice === undefined) {
        this.log.warn('Device {uuid} not found', uuid)
        return;
      }
      try {
        const response = await SonosCommandMapping.ExecuteControl(correctDevice, payload);
        if (payload?.command === SonosCommands.Seek) {
          await this.periodicallyUpdatePosition(correctDevice);
        }
        if(payload.replyTopic) {
          this.mqtt.publish(`${correctDevice.Uuid}/${payload.replyTopic}`, JSON.stringify(response));
        }
        this.log.debug('Executed {command} for {device} ({uuid})', payload.command ?? payload.sonosCommand, correctDevice.Name, correctDevice.Uuid)
      } catch (e) {
        if (e instanceof Error) {
          this.log.warn(e, 'Error executing {command} for {device} ({uuid})', payload.command ?? payload.sonosCommand, correctDevice.Name, correctDevice.Uuid)
        } else {
          this.log.warn('Error executing {command} for {device} ({uuid})', payload.command ?? payload.sonosCommand, correctDevice.Name, correctDevice.Uuid)
        }
        this.mqtt.publish(`${correctDevice.Uuid}/error`, {
          command: payload.command ?? payload.sonosCommand,
          error: e
        });
      }
    })
  }

  /**
   * Will setup event handlers from sonos devices, and what to publish
   */
  private setupSonosEvents(): void {
    this.sonosManager.Devices.forEach(async (d) => {
      const deviceDescription = await d.GetDeviceDescription();
      this.states.push({uuid: d.Uuid, model: deviceDescription.modelName, name: d.Name, groupName: d.GroupName, coordinatorUuid: d.Coordinator.Uuid})
      this.updateMembers(d);
      d.Events.on(SonosEvents.AVTransport, (data) => {
        this.updateStateWithAv(d.Uuid, data);
        this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/avtransport`, data)
      })
      d.Events.on(SonosEvents.RenderingControl, (data) => {
        this.updateStateWithRenderingControl(d.Uuid, data);
        this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/renderingcontrol`, data)
      })
      d.Events.on(SonosEvents.GroupName, (groupName) => {
        this.updateMembers(d);
        this.updateState(d.Uuid, { groupName });
        if(this.config.distinct === true) {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/group`, groupName)
        }
      })
      d.Events.on(SonosEvents.Coordinator, (coordinatorUuid) => {
        this.updateState(d.Uuid, { coordinatorUuid });
        if(this.config.distinct === true) {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/coordinator`, coordinatorUuid)
        }
      })
      d.Events.on('transportState', async (transportState) => {
        this.updateState(d.Uuid, { transportState } );
        if (this.config.distinct === true) {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/state`, transportState)
        }

        if (transportState === TransportState.Playing || transportState === TransportState.Transitioning) {
          await this.periodicallyUpdatePosition(d);
        } else {
          this.deleteProperty(d.Uuid, 'position');
          if(this.positionTimers[d.Uuid]) clearTimeout(this.positionTimers[d.Uuid]);
        }
      })
      d.Events.on(SonosEvents.CurrentTrackUri, async (trackUri) => {
        if (this.config.distinct === true) {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/trackUri`, trackUri)
        }
        if (d.CurrentTransportStateSimple == TransportState.Playing) {
          await this.periodicallyUpdatePosition(d);
        }
      })
      if(this.config.distinct === true) {
        d.Events.on(SonosEvents.CurrentTrackMetadata, (track) => {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/track`, track)
        })
        d.Events.on(SonosEvents.Mute, (mute) => {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/muted`, mute)
        })
        d.Events.on(SonosEvents.Volume, (volume) => {
          this.mqtt.publish(`status/${this.topicId(d.Name, d.Uuid)}/volume`, volume)
        })
      }
    })
  }

  private setupTvMonitoring(soundbar_uuid: string, coordinator_uuid: string): void {
    this.log.info('Setting up TV monitoring')
    const coordinator = this.sonosManager.Devices.find(d => d.Uuid=== coordinator_uuid);
    const soundbar = this.sonosManager.Devices.find(d => d.Uuid === soundbar_uuid);
    if (coordinator === undefined || soundbar === undefined) {
      return;
    }
    soundbar.Events.on('currentTrackUri', async (trackUri) => {
      if (trackUri.startsWith(this._soundbarTrackUri)) {
        this.log.info('Soundbar changed to TV audio')
        await coordinator?.Pause();
        if (this.config.tvVolume !== undefined && this.config.tvVolume > 0 && this.config.tvVolume <= 100) {
          this.previousTvVolume = soundbar?.Volume
          await soundbar?.SetVolume(this.config.tvVolume)
        }
      }
    });

    coordinator.Events.on('simpleTransportState', async (newState) => {
      if (newState === TransportState.Playing && soundbar?.CurrentTrackUri?.startsWith(this._soundbarTrackUri)) {
        this.log.info('Joining soundbar to coordinator');
        if (this.previousTvVolume !== undefined) {
          await soundbar?.SetVolume(this.previousTvVolume)
        }
        await soundbar?.AVTransportService.SetAVTransportURI({InstanceID: 0, CurrentURI: `x-rincon:${coordinator_uuid}`, CurrentURIMetaData: ''})
      }
    });


    // soundbar.Events.on('playbackStopped', async () => {
    //   this.log.info('Soundbar %s stopped playback', soundbar_uuid);
    //   if (this.previousTvVolume !== undefined) {
    //     await soundbar?.SetVolume(this.previousTvVolume)
    //   }
    //   await soundbar?.AVTransportService.SetAVTransportURI({InstanceID: 0, CurrentURI: `x-rincon:${coordinator_uuid}`, CurrentURIMetaData: ''})
    // })


  }

  private async periodicallyUpdatePosition(device: SonosDevice): Promise<void> {
    if(this.positionTimers[device.Uuid]) clearTimeout(this.positionTimers[device.Uuid]);

    const position = await device.AVTransportService.GetPositionInfo();
    if (position.RelTime === 'NOT_IMPLEMENTED') {
      this.deleteProperty(device.Uuid, 'position');
    } else {
      this.updateState(device.Uuid, { position: {Position: position.RelTime, LastUpdate: Date.now() }});
      this.positionTimers[device.Uuid] = setTimeout(() => {
        return this.periodicallyUpdatePosition(device);
      }, 30000)
    }
  }

  private updateMembers(device: SonosDevice): void {
    let members = this.sonosManager.Devices
      .filter(d => d.Coordinator.Uuid === device.Coordinator.Uuid)
      .map(d => { return { Name: d.Name, Uuid: d.Uuid }});
    
      if (members.length > 1) {
        members = members.sort((a, b) => a.Uuid === device.Coordinator.Uuid ? 0 : a.Uuid.localeCompare(b.Uuid));
        this.updateState(device.Uuid, { members: members });
      } else {
        this.deleteProperty(device.Uuid, 'members');
      }
      
    
  }

  private async publishDiscoveryMessages(): Promise<void> {
    for (const d of this.sonosManager.Devices) {
      const discoveryMessages = await HaAutoDiscovery.GenerateAutoDiscoveryMessages(d, this.config.prefix);
      this.log.debug("Publishing {msgCount} discovery messages for {uuid}", discoveryMessages.length, d.Uuid)
      for(const message of discoveryMessages) {
        this.mqtt.publishAutoDiscovery(message);
      }
    }
  }

  /**
   * The data from the AVTransportService event is merged with the state object, and the published to mqtt.
   *
   * @private
   * @param {string} uuid The UUID of the player to lookup the correct player
   * @param {AVTransportServiceEvent} data All event data
   * @memberof SonosToMqtt
   */
  private updateStateWithAv(uuid: string, data: AVTransportServiceEvent): void {
    if (typeof data.CurrentTrackMetaData === 'object') {
      const enqueuedMetadata = typeof data.EnqueuedTransportURIMetaData === 'object'
      ? { ...data.EnqueuedTransportURIMetaData, QueueLength: data.NumberOfTracks, QueuePosition: data.CurrentTrack }
      : { QueueLength: data.NumberOfTracks, QueuePosition: data.CurrentTrack };
      const update = {
        currentTrack: data.CurrentTrackMetaData,
        enqueuedMetadata: enqueuedMetadata,
        nextTrack: data.NextTrackMetaData,
        playmode: data.CurrentPlayMode,
        repeat: PlayModeHelper.ComputeRepeat(data.CurrentPlayMode ?? PlayMode.Normal),
        shuffle: PlayModeHelper.ComputeShuffle(data.CurrentPlayMode ?? PlayMode.Normal),
        crossfade: SonosToMqtt.BoolToOnOff(data.CurrentCrossfadeMode),
        alarmRunning: data.AlarmRunning === true
      } as SonosState;
      
      this.updateState(uuid, update)
    }
  }

  /**
   * The data from the RenderingControlService event is merged with the state object, and the published to mqtt.
   *
   * @private
   * @param {string} uuid The UUID of the player to lookup the correct player
   * @param {RenderingControlServiceEvent} data All event data
   * @memberof SonosToMqtt
   */
  private updateStateWithRenderingControl(uuid: string, data: RenderingControlServiceEvent): void {
    this.updateState(uuid, { 
      volume: data.Volume,
      mute: data.Mute,
      bass: data.Bass,
      treble: data.Treble,
    } as SonosState)
  }

  /**
   * Take partial state to update the current and publish to mqtt.
   *
   * @private
   * @param {string} uuid The UUID of the player to update.
   * @param {Partial<SonosState>} update partial state.
   * @memberof SonosToMqtt
   */
  private updateState(uuid: string, update: Partial<SonosState>): void {
    const index = this.states.findIndex(s => s.uuid === uuid)
    if(index !== -1) {
      // Merge update over the current state (only fields with value are updated)
      // The following would also remove values if undefined in update. Anyone has a better solution, please?
      //this.states[index] = {...this.states[index], ...update};
      // Enumarate update object entries and only copy values where it has a value
      for(const [key, value] of Object.entries(update)) {
        if(value !== undefined) {
          const currentValue = this.states[index][key];
          if (typeof value === 'object' && typeof currentValue === 'object') {
            this.states[index][key] = { ...currentValue, ...value }
            continue;
          }
          if (value === -1 || (typeof value === 'string' && value === '')) {
            this.states[index][key] = undefined;
            continue;
          }
          
          this.states[index][key] = value;
        }
      }

      // Change timestamp to now
      this.states[index].ts = Date.now();

      // Clear publish timeout if set. This also means that if a player keeps sending updates within 400 ms there will not be an event (possible bug).
      if(this.stateTimers[uuid] !== undefined) clearTimeout(this.stateTimers[uuid]);

      // Publish new state on a 400 ms delay. For changes that happen in rapid succession.
      this.stateTimers[uuid] = setTimeout(() => {
        this.log.verbose('Publishing state for {uuid}', this.states[index].uuid)
        this.mqtt.publish(this.states[index].uuid ?? '', this.states[index], { qos: 0, retain: true }, this.config.discovery);
      }, 400)
    }
  }

  private deleteProperty(uuid: string, key: 'position' | 'members'): void {
    const index = this.states.findIndex(s => s.uuid === uuid)
    if(index !== -1) {
      delete this.states[index][key];
    }
  }

  private topicId(name: string, uuid: string): string {
    return this.config.friendlynames === 'name' ? SonosToMqtt.CleanName(name) : uuid;
  }

  private static CleanName (name: string): string {
    return name.toLowerCase().replace(/\s/g, '-')
  }

  private static BoolToOnOff(input?: boolean): string | undefined {
    return input === undefined
      ? undefined
      : (input === true ? 'On': 'Off')
  }
}
