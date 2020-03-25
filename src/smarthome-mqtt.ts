import debug = require('debug')
import mqtt, { IClientPublishOptions } from 'mqtt'
import { MqttClient } from 'mqtt'
import {StrictEventEmitter} from 'strict-event-emitter-types'
import {EventEmitter} from 'events'
import { DeviceControl } from './device-control'

interface MqttEvents {
  connected: (connected: boolean) => void;
  generic: (command: string, payload?: any | undefined) => void;
  deviceControl: (uuid: string, payload: DeviceControl) => void;
}

export class SmarthomeMqtt{
  private readonly debug = debug('sonos2mqtt:mqtt')
  private readonly uri: URL
  private mqttClient?: MqttClient;
  public readonly Events: StrictEventEmitter<EventEmitter, MqttEvents> = new EventEmitter();
  constructor(mqttUrl: string, private readonly prefix: string = 'sonos') {
    this.uri = new URL(mqttUrl)
  }

  connect(): void {
    this.mqttClient = mqtt.connect(this.uri.toString(), {
      will: {
        topic: `${this.prefix}/connected`,
        payload: '',
        qos: 0,
        retain: true
      },
      keepalive: 60000
    });
    this.mqttClient.on('connect',() => {
      this.debug('Connected to server %s', this.uri.host)
      this.Events.emit('connected', true)
      this.mqttClient?.subscribe(`${this.prefix}/set/+/+`)
      this.mqttClient?.subscribe(`${this.prefix}/cmd/+`)
      this.mqttClient?.subscribe(`${this.prefix}/+/control`)

    })
    this.mqttClient.on('message', (topic, payload, packet) => {this.handleIncomingMessage(topic,payload,packet)})
    this.mqttClient.on('close', () => {
      this.Events.emit('connected', false)
      this.debug('mqtt closed ' + this.uri.host)
    })
  
    this.mqttClient.on('error', (err) => {
      this.debug('mqtt %s', err)
    })
  
    this.mqttClient.on('offline', () => {
      this.debug('mqtt offline')
    })
  
    this.mqttClient.on('reconnect', () => {
      this.debug('mqtt reconnect')
    })
  }

  close(): void {
    this.mqttClient?.end()
  }

  publish(topic: string, payload: string | any, options: IClientPublishOptions = {} as IClientPublishOptions): void {
    if(typeof payload === 'number') payload = payload.toString();
    if(typeof payload === 'boolean') payload = payload === true ? 'true': 'false'
    if(typeof payload !== 'string') payload = JSON.stringify(payload);
    this.mqttClient?.publish(`${this.prefix}/${topic}`, payload, options)
  }

  publishAutodiscovery(prefix: string, uuid: string, payload: any): void {
    if(typeof payload !== 'string') payload = JSON.stringify(payload);
    const topic = `${prefix}/music_player/${uuid}/sonos/config`;
    this.mqttClient?.publish(topic, payload, { qos:0, retain: true });
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleIncomingMessage(topic: string, payload: Buffer, packet: mqtt.Packet): void {
    const parsedPayload = SmarthomeMqtt.parsePayload(payload.toString())
    const parts = topic.toLocaleLowerCase().split('/')
    
    if(parts.length === 4 && parts[1] === 'set') {
      this.debug('Got command %s for %s', parts[3], parts[2])
      const control = new DeviceControl(parts[3], undefined, parsedPayload);
      if(control.isValid()) {
        this.Events.emit('deviceControl', parts[2], control)
      }
    } else if (parts.length === 3
        && parts[2] === 'control'
        && typeof parsedPayload !== "number" 
        && typeof parsedPayload !== 'string') {
      const control = new DeviceControl(parsedPayload.cmd ?? parsedPayload.command, parsedPayload.sonosCommand, parsedPayload.input)

      if(control.isValid()) {
        this.Events.emit('deviceControl', parts[1], control)
      }
    } else if (parts.length === 3 && parts[1] === 'cmd') {
      this.debug('Got generic command %s', parts[2])
      this.Events.emit('generic', parts[2], parsedPayload)
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
