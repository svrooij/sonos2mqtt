var pkg = require('../package.json')
var config = require('yargs')
  .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
  .describe('v', 'Verbosity level')
  .describe('i', 'instance name. used as mqtt client id and as prefix for connected topic')
  .describe('mqtt', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
  .describe('d', 'Publish distinct track states')
  .describe('h', 'show help')
  .describe('tts-lang', 'Default TTS language')
  .describe('tts-endpoint', 'Default endpoint for text-to-speech')
  .describe('device', 'Start with one known IP instead of device discovery.')
  .alias({
    h: 'help',
    i: 'name',
    v: 'verbosity',
    d: 'publish-distinct'
  })
  .boolean('d')
  .default({
    mqtt: 'mqtt://127.0.0.1',
    i: 'sonos',
    v: 'info',
    d: false,
    'tts-lang': 'en-US',
    'tts-endpoint': undefined
  })
  .choices('v', ['error', 'warn', 'info', 'debug'])
  .wrap(80)
  // .config('config')
  .version()
  .help('help')
  .env('SONOS2MQTT')
  .argv

module.exports = config
