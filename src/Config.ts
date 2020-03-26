// import pkg from '../package.json'
import yargs from 'yargs'
import fs from 'fs'
import path from 'path'
import { StaticLogger } from './static-logger';

export interface Config {
  mqtt: string;
  prefix: string;
  distinct: boolean;
  device?: string;
  ttslang?: string;
  ttsendpoint?: string;
  discovery: boolean;
  discoveryprefix: string;
  log: string;
}

const defaultConfig: Config = {
  mqtt: 'mqtt://127.0.0.1',
  prefix: 'sonos',
  distinct: false,
  discovery: true,
  discoveryprefix: 'homeassistant',
  log: 'information'
}

export class ConfigLoader {
  static LoadConfig(): Config {
    const config = {...defaultConfig,...(ConfigLoader.LoadConfigFromFile() ?? ConfigLoader.LoadConfigFromArguments())};

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
    if(process.env.CONFIG_FILE !== undefined && fs.existsSync(process.env.CONFIG_FILE)) {
      const fileContent = fs.readFileSync(process.env.CONFIG_FILE).toString()
      return JSON.parse(fileContent) as Partial<Config>

    }
    return;
  }

  private static LoadConfigFromArguments(): Partial<Config> {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString())
    return yargs
      .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
      .describe('prefix', 'instance name. used as mqtt client id and as prefix for connected topic')
      .describe('mqtt', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
      .describe('log', 'Set the loglevel')
      .describe('d', 'Publish distinct track states')
      .describe('h', 'show help')
      .describe('ttslang', 'Default TTS language')
      .describe('ttsendpoint', 'Default endpoint for text-to-speech')
      .describe('device', 'Start with one known IP instead of device discovery.')
      .describe('discovery', 'Emit retained auto-discovery messages for each player.')
      .describe('discoveryprefix', 'The prefix for the discovery messages')
      .alias({
        h: 'help',
        d: 'distinct'
      })
      .boolean('d')
      .boolean('discovery')
      .default({
        mqtt: 'mqtt://127.0.0.1',
        prefix: 'sonos',
        d: false,
        'ttslang': 'en-US',
        'ttsendpoint': undefined,
        discoveryprefix: 'homeassistant',
        log: 'information'
      })
      .choices('log', ['warning', 'information', 'debug'])
      .wrap(80)
      .version()
      .help('help')
      .env('SONOS2MQTT')
      .argv as Partial<Config>
  }
}
