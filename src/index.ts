#!/usr/bin/env node

import {SonosToMqtt} from './sonos-to-mqtt'
import {ConfigLoader} from './config'
import { StaticLogger } from './static-logger'

const sonosToMqtt = new SonosToMqtt(ConfigLoader.LoadConfig())

sonosToMqtt
  .start()
  .then(success => {
    if(success) {
      process.on('SIGINT', async () => {
        StaticLogger.Default().info('Shutdown sonos2mqtt, please wait.')
        sonosToMqtt.stop()
        setTimeout(() => { process.exit(0) }, 800)
      })
    }
  })
  .catch(err => {
    StaticLogger.Default().fatal(err, 'Error starting sonos2mqtt')
  })
  