// import pkg from '../package.json'
import yargs from 'yargs'
import fs from 'fs'
import path from 'path'
import { StaticLogger } from './static-logger';

export interface Config {
  mqtt: string;
  prefix: string;
  wait: number;
  distinct: boolean;
  device?: string;
  ttslang?: string;
  ttsendpoint?: string;
  discovery: boolean;
  log: string;
  clientid?: string;
  friendlynames: 'name' | 'uuid';
  tvGroup?: string;
  tvUuid?: string;
  tvVolume?: number;
  experimental?: boolean;
  secure?: SecureConfig;
}

export interface SecureConfig {
  key?: string | string[] | Buffer | Buffer[] | any[];
  keyPath?: string;
  cert?: string | string[] | Buffer | Buffer[];
  certPath?: string;
  ca?: string | string[] | Buffer | Buffer[];
  caPaths?: string | string[];
  rejectUnauthorized?: boolean;
}

const defaultConfig: Config = {
  mqtt: 'mqtt://127.0.0.1',
  prefix: 'sonos',
  wait: 30,
  distinct: false,
  discovery: false,
  log: 'information',
  friendlynames: 'name',
  experimental: false,
}

export class ConfigLoader {
  static async LoadConfig(): Promise<Config> {
    const extraConfig = ConfigLoader.LoadConfigFromFile() ?? await ConfigLoader.LoadConfigFromArguments();
    const config = {...defaultConfig, ...extraConfig};
    
    if (config.ttsendpoint !== undefined && process.env.SONOS_TTS_ENDPOINT === undefined) {
      process.env.SONOS_TTS_ENDPOINT = config.ttsendpoint
    }

    if (config.ttslang !== undefined && process.env.SONOS_TTS_LANG === undefined) {
      process.env.SONOS_TTS_LANG = config.ttslang
    }

    StaticLogger.setLevel(config.log)

    return config;
  }

  private static LoadConfigFromFile(): Partial<Config> | undefined {
    // https://developers.home-assistant.io/docs/hassio_addon_config
    if (process.env.CONFIG_PATH === undefined) process.env.CONFIG_PATH = '/data/options.json'
    if(fs.existsSync(process.env.CONFIG_PATH)) {
      const fileContent = fs.readFileSync(process.env.CONFIG_PATH).toString()
      return JSON.parse(fileContent) as Partial<Config>
    }
    return;
  }

  private static async LoadConfigFromArguments(): Promise<Partial<Config>> {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString())
    const config = await yargs
      .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
      .describe('prefix', 'instance name. used as prefix for all topics')
      .describe('mqtt', 'mqtt broker url. See https://sonos2mqtt.svrooij.io/getting-started.html#configuration')
      .describe('mqtt_cert_path', 'Path to the certificate file for secure mqtt connections.')
      
      .describe('mqtt_key_path', 'Path to the key file for secure mqtt connections.')
      .describe('mqtt_ca_path', 'Path to the ca file for secure mqtt connections.')
      .describe('mqtt_reject_unauthorized', 'Reject unauthorized connections.')
      .boolean('mqtt_reject_unauthorized')
      .describe('clientid', 'Specify the client id to be used')
      .describe('wait', 'Number of seconds to search for speakers')
      .describe('log', 'Set the loglevel')
      .describe('d', 'Publish distinct track states')
      .describe('h', 'show help')
      .describe('ttslang', 'Default TTS language')
      .describe('ttsendpoint', 'Default endpoint for text-to-speech')
      .describe('device', 'Start with one known IP instead of device discovery.')
      .describe('discovery', 'Emit retained auto-discovery messages for each player.')
      .describe('friendlynames', 'Use device name or uuid in topics (except the united topic, always uuid)')
      .choices('friendlynames', ['name', 'uuid'])
      .describe('tvGroup', 'The UUID of the coordinator to which the Soundbar should be joined')
      .describe('tvUuid', 'The UUID of the soundbar which should auto stop the tvGroup')
      .describe('tvVolume', 'Volume the soundbar should go to when TV playback starts')
      .number('tv_volume')
      .describe('experimental', 'Activate some cutting edge features')
      .boolean('experimental')
      .alias({
        h: 'help',
        d: 'distinct'
      })
      .number('wait')
      .boolean('d')
      .boolean('discovery')
      .default({
        mqtt: 'mqtt://127.0.0.1',
        prefix: 'sonos',
        wait: 30,
        'ttslang': 'en-US',
        'ttsendpoint': undefined,
        log: 'information',
      })
      .choices('log', ['warning', 'information', 'debug'])
      .wrap(90)
      .version()
      .help('help')
      .env('SONOS2MQTT')
      .argv;
    

    if (config.mqtt_cert_path !== undefined || config.mqtt_key_path !== undefined || config.mqtt_ca_path !== undefined || config.mqtt_reject_unauthorized === true) {
      config.secure = {
        keyPath: config.mqtt_key_path,
        certPath: config.mqtt_cert_path,
        caPaths: config.mqtt_ca_path,
        rejectUnauthorized: config.mqtt_reject_unauthorized
      }
    }
    return config as Partial<Config>;
  }
}
