import { Config } from './config'
import { StaticLogger } from './static-logger'
import { SonosManager, SonosEvents } from '@svrooij/sonos'
import { SmarthomeMqtt } from './smarthome-mqtt';
import { SonosCommandMapping } from './sonos-command-mapping';
import { SonosState } from './sonos-state';
import { AVTransportServiceEvent, RenderingControlServiceEvent } from '@svrooij/sonos/lib/services';
import { SonosCommands } from './sonos-commands';
export class SonosToMqtt {
  private readonly sonosManager: SonosManager;
  private readonly mqtt: SmarthomeMqtt;
  private readonly log = StaticLogger.CreateLoggerForSource('Sonos2mqtt.main')
  private readonly states: Array<Partial<SonosState>> = [];
  private readonly stateTimers: {[key: string]: NodeJS.Timeout} = {};
  constructor(private config: Config) {
    this.sonosManager = new SonosManager();
    this.mqtt = new SmarthomeMqtt(config.mqtt, config.prefix);
  }

  async start(): Promise<boolean> {
    this.log.info('Starting sonos2mqtt')
    let success: boolean
    if(this.config.device !== undefined) {
      success = await this.sonosManager.InitializeFromDevice(this.config.device);
    } else {
      success = await this.sonosManager.InitializeWithDiscovery();
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
          return Promise.all(this.sonosManager.Devices.map(d => d.PlayNotification(payload)))
        case 'pauseall':
          return Promise.all(this.sonosManager.Devices.map(d => d.Pause()));
        case 'listalarm':
          const alarms = await this.sonosManager.Devices[0].AlarmClockService.ListAndParseAlarms()
          this.mqtt.publish('alarms', alarms);
          break;
        case 'setalarm':
          return this.sonosManager.Devices[0].AlarmClockService.PatchAlarm(payload);
        case 'setlogging':
          return StaticLogger.setLevel(payload);
      }
    })

    this.mqtt.Events.on('deviceControl', async (uuid, payload)=> {
      const correctDevice = this.sonosManager.Devices.find(d => d.Uuid.toLocaleLowerCase() === uuid || SonosToMqtt.CleanName(d.Name) === uuid);
      if(correctDevice === undefined) {
        this.log.warn('Device {uuid} not found', uuid)
        return;
      }
      try {
        await SonosCommandMapping.ExecuteControl(correctDevice, payload)
        this.log.debug('Executed {command} for {device} ({uuid})', payload.command ?? payload.sonosCommand, correctDevice.Name, correctDevice.Uuid)
      } catch (e) {
        this.log.warn(e, 'Error executing {command} for {device} ({uuid})', payload.command ?? payload.sonosCommand, correctDevice.Name, correctDevice.Uuid)
      }
    })
  }

  /**
   * Will setup event handlers from sonos devices, and what to publish
   */
  private setupSonosEvents(): void {
    this.sonosManager.Devices.forEach(d => {
      this.states.push({uuid: d.Uuid, name: d.Name, groupName: d.GroupName, coordinatorUuid: d.Coordinator.Uuid})
      d.Events.on(SonosEvents.AVTransport, (data) => {
        this.updateStateWithAv(d.Uuid, data);
        this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/avtransport`,data)
      })
      d.Events.on(SonosEvents.RenderingControl, (data) => {
        this.updateStateWithRenderingControl(d.Uuid, data);
        this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/renderingcontrol`,data)
      })
      d.Events.on(SonosEvents.GroupName, (groupName) => {
        this.updateState(d.Uuid, { groupName });
        if(this.config.distinct === true) {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/group`, groupName)
        }
      })
      d.Events.on(SonosEvents.Coordinator, (coordinatorUuid) => {
        this.updateState(d.Uuid, { coordinatorUuid });
        if(this.config.distinct === true) {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/coordinator`, coordinatorUuid)
        }
      })
      if(this.config.distinct === true) {
        d.Events.on(SonosEvents.CurrentTrackMetadata, (track) => {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/track`, track)
        })
        d.Events.on(SonosEvents.CurrentTrackUri, (trackUri) => {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/trackUri`, trackUri)
        })
        d.Events.on(SonosEvents.Mute, (mute) => {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/muted`, mute)
        })
        d.Events.on(SonosEvents.CurrentTransportStateSimple, (state) => {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/state`, state)
        })
        d.Events.on(SonosEvents.Volume, (volume) => {
          this.mqtt.publish(`status/${SonosToMqtt.CleanName(d.Name)}/volume`, volume)
        })

      }
    })
  }

  private publishDiscoveryMessages(): void {
    this.sonosManager.Devices.forEach(d => {
      const payload = {
        available_commands: Object.values(SonosCommands),
        command_topic: `${this.config.prefix}/${d.Uuid}/control`,
        device: {
          identifiers: [d.Uuid],
          manufacturer: 'Sonos',
          // model: '', Model not available at the moment (but would be nice if added in the sonos lib)
          name: d.Name
        },
        device_class: 'speaker',
        icon: 'mdi:speaker',
        json_attributes: true,
        json_attributes_topic: `${this.config.prefix}/${d.Uuid}`,
        name: d.Name,
        state_topic: `${this.config.prefix}/${d.Uuid}`,
        unique_id: `sonos2mqtt_${d.Uuid}_speaker`,
        availability_topic: `${this.config.prefix}/connected`,
        payload_available: '2'
      };
      this.mqtt.publishAutodiscovery(this.config.discoveryprefix ?? 'homeassistant', d.Uuid, payload);
    });
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
    this.updateState(uuid, {
      currentTrack: data.CurrentTrackMetaData,
      enqueuedMetadata: data.EnqueuedTransportURIMetaData,
      nextTrack: data.NextTrackMetaData,
      transportState: data.TransportState,
      playmode: data.CurrentPlayMode,
    })
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
      mute: data.Mute
    })
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
      this.states[index] = {...this.states[index], ...update};

      // Change timestamp to now
      this.states[index].ts = Date.now();

      // Clear publish timeout if set. This also means that if a player keeps sending updates within 400 ms there will not be an event (possible bug).
      if(this.stateTimers[uuid] !== undefined) clearTimeout(this.stateTimers[uuid]);

      // Publish new state on a 400 ms delay. For changes that happen in rapid succession.
      this.stateTimers[uuid] = setTimeout(() => {
        this.log.verbose('Publishing state for {uuid}', this.states[index].uuid)
        this.mqtt.publish(this.states[index].uuid ?? '', this.states[index], { qos: 0, retain: true });
      }, 400)
    }
  }

  private static CleanName (name: string): string {
    return name.toLowerCase().replace(/\s/g, '-')
  }
}
