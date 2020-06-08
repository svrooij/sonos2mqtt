import mqtt, { IClientPublishOptions } from 'mqtt'
import { MqttClient } from 'mqtt'
import {StrictEventEmitter} from 'strict-event-emitter-types'
import {EventEmitter} from 'events'
import { DeviceControl } from './device-control'
import {StaticLogger} from './static-logger'

interface MqttEvents {
  connected: (connected: boolean) => void;
  generic: (command: string, payload?: any | undefined) => void;
  deviceControl: (uuid: string, payload: DeviceControl) => void;
}

export class SmarthomeMqtt{
  private readonly log = StaticLogger.CreateLoggerForSource('sonos2mqtt.SmarthomeMqtt')
  private readonly uri: URL
  private mqttClient?: MqttClient;
  public readonly Events: StrictEventEmitter<EventEmitter, MqttEvents> = new EventEmitter();
  constructor(mqttUrl: string, private readonly prefix: string = 'sonos', private readonly clientId?: string) {
    this.uri = new URL(mqttUrl)
  }

  connect(): void {
    this.mqttClient = mqtt.connect(this.uri.toString(), {
      will: {
        topic: `${this.prefix}/connected`,
        payload: '0',
        qos: 0,
        retain: true
      },
      keepalive: 60000,
      clientId: this.clientId
    });
    this.mqttClient.on('connect',() => {
      this.log.debug('Connected to server {server}', this.uri.host)
      this.Events.emit('connected', true)
      this.mqttClient?.subscribe(`${this.prefix}/set/+/+`)
      this.mqttClient?.subscribe(`${this.prefix}/cmd/+`)
      this.mqttClient?.subscribe(`${this.prefix}/+/control`)
    })
    this.mqttClient.on('message', (topic, payload, packet) => {this.handleIncomingMessage(topic,payload,packet)})
    this.mqttClient.on('close', () => {
      this.Events.emit('connected', false)
      this.log.debug('Mqtt connection closed with {server}', this.uri.host)

    })
  
    this.mqttClient.on('error', (err) => {
      this.log.warn(err, 'Mqtt error')
    })
  
    this.mqttClient.on('offline', () => {
      this.log.warn('Mqtt offline {server}', this.uri.host)

    })
  
    this.mqttClient.on('reconnect', () => {
      this.log.info('Mqtt reconnecting {server}', this.uri.host)

    })
  }

  close(): void {
    this.publishStatus('0');
    this.mqttClient?.end()
  }

  publish(topic: string, payload: string | any, options: IClientPublishOptions = {} as IClientPublishOptions): void {
    topic = `${this.prefix}/${topic}`
    if(typeof payload === 'number') payload = payload.toString();
    if(typeof payload === 'boolean') payload = payload === true ? 'true': 'false'
    this.log.verbose('Mqtt publish to {topic} {payload}', topic, payload)
    if(typeof payload !== 'string') payload = JSON.stringify(payload);
    this.mqttClient?.publish(topic, payload, options)
  }

  publishAutodiscovery(prefix: string, uuid: string, payload: any): void {
    if(typeof payload !== 'string') payload = JSON.stringify(payload);
    const topic = `${prefix}/music_player/${uuid}/sonos/config`;
    this.mqttClient?.publish(topic, payload, { qos:0, retain: true });
  }

  publishStatus(status: '0' | '1' | '2'): void {
    this.publish('connected', status, { retain: true, qos: 0 })
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleIncomingMessage(topic: string, payload: Buffer, packet: mqtt.Packet): void {
    const parsedPayload = SmarthomeMqtt.parsePayload(payload.toString())
    const parts = topic.replace(`${this.prefix}/`, '').toLocaleLowerCase().split('/')
    
    // topic: {prefix}/set/name_of_speaker/command
    // parts: ['set', 'name_of_speaker', 'command']
    if(parts.length === 3 && parts[0] === 'set') {
      this.log.debug('Mqtt parsing {command} for {device}', parts[2], parts[1])
      const control = new DeviceControl(parts[2], undefined, parsedPayload);
      if(control.isValid()) {
        this.Events.emit('deviceControl', parts[1], control)
      }
    } 
     // topic: {prefix}/uuid_of_speaker/control
     // parts: ['uuid_of_speaker', 'control']
    else if (parts.length === 2
        && parts[1] === 'control'
        && typeof parsedPayload !== "number" 
        && typeof parsedPayload !== 'string') {
      this.log.debug('Mqtt parsing {command} for {device}', parsedPayload.cmd ?? parsedPayload.command, parts[0])
      const control = new DeviceControl(parsedPayload.cmd ?? parsedPayload.command, parsedPayload.sonosCommand, parsedPayload.input)

      if(control.isValid()) {
        this.Events.emit('deviceControl', parts[0], control)
      }
    }
    // topic: {prefix}/cmd/global_command
    // parts: ['cmd', 'global_command']
    else if (parts.length === 2 && parts[0] === 'cmd') { 
      this.log.debug('Mqtt got generic command {command}', parts[1])
      this.Events.emit('generic', parts[1], parsedPayload)
    }
  }

  private static parsePayload(payload: string | undefined): any | number | undefined {
    if (payload === undefined) return;
    if (payload === '') return '';
    if(isNaN(Number(payload)) === false) return Number(payload);
    try {
      return JSON.parse(payload)
    } catch {
    }
    return payload
  }
}
