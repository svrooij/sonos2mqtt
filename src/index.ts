#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import {SonosToMqtt} from './sonos-to-mqtt'
import {ConfigLoader} from './config'
import { StaticLogger } from './static-logger'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString())
StaticLogger.Default().info(`Starting ${pkg.name} v${pkg.version}`)

async function main() {
  const sonosToMqtt = new SonosToMqtt(await ConfigLoader.LoadConfig())
  const result = await sonosToMqtt.start();
  if (!result) {
    StaticLogger.Default().fatal('Failed to start sonos2mqtt')
    process.exit(1)
  }
  function stop() { 
    StaticLogger.Default().info('Shutdown sonos2mqtt, please wait.')
    sonosToMqtt.stop()
    setTimeout(() => { process.exit(0) }, 800)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

main()
  .catch(err => {
    StaticLogger.Default().fatal(err, 'Error starting sonos2mqtt')
  })
  