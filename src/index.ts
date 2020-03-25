import {SonosToMqtt} from './sonos-to-mqtt'
import {ConfigLoader} from './config'

const sonosToMqtt = new SonosToMqtt(ConfigLoader.LoadConfig())

sonosToMqtt
  .start()
  .then(success => {
    if(success) {
      console.log('Sonos2Mqtt started')
      process.on('SIGINT', async () => {
        console.log('Shutting down listeners, please wait')
        sonosToMqtt.stop()
        setTimeout(() => { process.exit(0) }, 800)
      })
    }
  })
  .catch(err => {
    console.error('Sonos2Mqtt failed to start', err)
  })