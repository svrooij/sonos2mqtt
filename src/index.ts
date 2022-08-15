#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import {SonosToMqtt} from './sonos-to-mqtt'
import {ConfigLoader} from './config'
import { StaticLogger } from './static-logger'

const sonosToMqtt = new SonosToMqtt(ConfigLoader.LoadConfig())
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString())
StaticLogger.Default().info(`Starting ${pkg.name} v${pkg.version}`)

const stop = function () {
  StaticLogger.Default().info('Shutdown sonos2mqtt, please wait.')
  sonosToMqtt.stop()
  setTimeout(() => { process.exit(0) }, 800)
}

sonosToMqtt
  .start()
  .then(success => {
    if(success) {
      process.on('SIGINT', () => stop())
      process.on('SIGTERM', () => stop())
    }
  })
  .catch(err => {
    StaticLogger.Default().fatal(err, 'Error starting sonos2mqtt')
  })
  