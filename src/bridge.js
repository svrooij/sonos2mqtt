#!/usr/bin/env node

const pkg = require('../package.json')
const log = require('yalm')
const config = require('./config.js')
const parser = require('xml2json')
const mqtt = require('mqtt')
const s = require('sonos')

let mqttClient
let search
let devices = []

function start () {
  log.setLevel(config.verbosity)
  log.info(pkg.name + ' ' + pkg.version + ' starting')

  // MQTT Stuff
  // Define the will message (is send on disconnect).
  const mqttOptions = {
    will: {
      topic: config.name + '/connected',
      message: 0,
      qos: 0,
      retain: true
    }
  }

  mqttClient = mqtt.connect(config.url, mqttOptions)

  mqttClient.on('connect', () => {
    log.info('Connected to mqtt %s', config.url)
    mqttClient.subscribe(config.name + '/set/+/+')
    mqttClient.subscribe(config.name + '/cmd/+')
  })

  mqttClient.on('message', handleIncomingMessage)

  mqttClient.on('close', () => {
    log.info('mqtt closed ' + config.mqtt)
  })

  mqttClient.on('error', err => {
    log.error('mqtt', err.toString())
  })

  mqttClient.on('offline', () => {
    log.error('mqtt offline')
  })

  mqttClient.on('reconnect', () => {
    log.info('mqtt reconnect')
  })

  // Start searching for devices
  log.info('Start searching for Sonos players')
  search = s.search({timeout: 4000})
  search.on('DeviceAvailable', (device, model) => {
    log.debug('Found device (%s) with IP: %s', model, device.host)

    device.getZoneAttrs((err, attrs) => {
      if (err) {
        log.error('Get Zone error ', err)
        return
      }
      // log.info('Found: ' + host.name + ' with IP: ' + host.ip)
      log.info('Found player (%s): %s with IP: %s', model, attrs.CurrentZoneName, device.host)
      device.name = attrs.CurrentZoneName
      // hosts.push(host)
      addDevice(device)
    })
  })
  search.on('timeout', () => {
    publishConnectionStatus()
  })

  process.on('SIGINT', () => {
    log.info('Shutting down listeners, please wait')
    devices.forEach(device => {
      device.stopListening((err, success) => {
        if (err) {
          log.error('Error shutting down listner %j', err)
          return
        }

        log.info('Listener shutdown successfully')
      })
    })
    setTimeout(() => {
      process.exit()
    }, 1000)
  })
}

// This function will receive all incoming messages from MQTT
function handleIncomingMessage (topic, payload) {
  payload = payload.toString()
  log.debug('Incoming message to %s %j', topic, payload)

  const parts = topic.toLowerCase().split('/')

  // Commands for devices
  if (parts[1] === 'set' && parts.length === 4) {
    let device = devices.find((device) => { return device.name.toLowerCase() === parts[2] })
    if (device) {
      handleDeviceCommand(device, parts[3], payload)
    } else {
      log.error('Device with name %s not found', parts[2])
    }
  } else if (parts[1] === 'cmd' && parts.length === 3) {
    handleGenericCommand(parts[2], payload)
  }
}

// This function is called when a device command is recognized by 'handleIncomingMessage'
function handleDeviceCommand (device, command, payload) {
  log.debug('Incoming device command %s for %s payload %s', command, device.name, payload)
  switch (command) {
    // ------------------ Playback commands
    case 'next':
      device.next((err, res) => {
        log.debug([err, res])
      })
      break
    case 'pause':
    case 'pauze':
      device.pause((err, res) => {
        log.debug([err, res])
      })
      break
    case 'play':
      device.play((err, res) => {
        log.debug([err, res])
      })
      break
    case 'previous':
      device.previous((err, res) => {
        log.debug([err, res])
      })
      break
    case 'stop':
      device.stop((err, res) => {
        log.debug([err, res])
      })
      break
    // ------------------ Volume commands
    case 'volume':
      if (IsNumeric(payload)) {
        var vol = parseInt(payload)
        if (vol >= 0 && vol <= 100) {
          device.setVolume(vol, (err, success) => {
            if (!err && success) {
              log.info('Changed volume to %d', vol)
            }
          })
        }
      } else {
        log.error('Payload for setting volume is not numeric')
      }
      break
    case 'volumeup':
      handleVolumeCommand(device, payload, 1)
      break
    case 'volumedown':
      handleVolumeCommand(device, payload, -1)
      break
    case 'mute':
      device.setMuted(true, (err, res) => {
        log.debug([err, res])
      })
      break
    case 'unmute':
      device.setMuted(false, (err, res) => {
        log.debug([err, res])
      })
      break
    // ------------------ Sleeptimer
    case 'sleep':
      if (IsNumeric(payload)) {
        var minutes = parseInt(payload)
        if (minutes > 0 && minutes < 1000) {
          device.configureSleepTimer(minutes, (err, success) => {
            log.debug('Sleeptimer set %j', [err, success])
          })
        }
      } else {
        log.error('Payload for setting sleeptimer is not numeric')
      }
      break
    default:
      log.debug('Command %s not yet supported', command)
      break
  }
}

 // This function is used by 'handleDeviceCommand' for handeling the volume up/down commands
function handleVolumeCommand (device, payload, modifier) {
  let change = 5
  if (IsNumeric(payload)) {
    let tempIncrement = parseInt(payload)
    if (tempIncrement > 0 && tempIncrement < 100) {
      change = tempIncrement
    }
  }
  device.getVolume((err, vol) => {
    if (err) {
      log.error('Error getting volume', err)
      return
    }
    let newVolume = vol + (change * modifier)
    device.setVolume(newVolume, (err2, res) => {
      log.info('Volume modified from %d to %d', vol, newVolume)
    })
  })
}

// This function is called when a generic command is recognized by 'handleIncomingMessages'
function handleGenericCommand (command, payload) {
  switch (command) {
    // ------------------ Alarms
    case 'listalarms':
      listAlarms()
      break
    // ------------------ Control all devices
    case 'pauseall':
      devices.forEach(device => {
        device.pause((err) => {
          log.debug(err)
        })
      })
      break

    default:
      log.error('Command %s isn\' implemented', command)
      break
  }
}

// Loading the alarms and publishing them to 'sonos/alarms'
function listAlarms () {
  var alarmService = new s.Services.AlarmClock(devices[0].host)
  alarmService.ListAlarms({}, (err, res) => {
    if (err) {
      log.error('Error loading alarms from %s %j', devices[0].host, err)
      return
    }

    var alarms = JSON.parse(parser.toJson(res.CurrentAlarmList)).Alarms.Alarm

    // For better reading we remove the metadata.
    alarms.forEach(alarm => {
      delete alarm.ProgramMetaData
    })

    log.debug('Got alarms %j', alarms)
    publishData(config.name + '/alarms', alarms)
  })
}

function publishConnectionStatus () {
  let status = '1'
  if (devices.length > 0) { status = '2' }
  mqttClient.publish(config.name + '/connected', status, {
    qos: 0,
    retain: true
  })
}

// This function is called by the device discovery, used to setup listening for certain events.
function addDevice (device) {
  // Start listening for those events!
  device.on('TrackChanged', track => {
    publishCurrentTrack(device, track)
  })
  device.on('StateChanged', state => {
    publishState(device, state)
  })
  device.on('Muted', muted => {
    publishMuted(device, muted)
  })
  device.on('VolumeChanged', volume => {
    publishVolume(device, volume)
  })

  devices.push(device)
}

// Used by event handler
function publishVolume (device, volume) {
  publishData(config.name + '/status/' + device.name + '/volume', volume, device.name, true)
}

// Used by event handler
function publishMuted (device, muted) {
  publishData(config.name + '/status/' + device.name + '/muted', muted, device.name, true)
}

// Used by event handler
function publishState (device, state) {
  publishData(config.name + '/status/' + device.name + '/state', state, device.name, true)
}

// Used by event handler
function publishCurrentTrack (device, track) {
  log.debug('New track data for %s %j', device.name, track)
  if (config.publishDistinct) {
    publishData(config.name + '/status/' + device.name + '/title', track.title, device.name)
    publishData(config.name + '/status/' + device.name + '/artist', track.artist, device.name)
    publishData(config.name + '/status/' + device.name + '/album', track.album, device.name)
    publishData(config.name + '/status/' + device.name + '/albumart', track.albumArtURL, device.name)
  } else {
    let val = (track && track.title) ? {
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArtURL
    } : null
    if (device.lastTrack !== val) {
      publishData(config.name + '/status/' + device.name + '/track', val, device.name)
      device.lastTrack = val
    }
  }
}

// This function will format the data before publishing to mqtt
function publishData (topic, dataVal, name = null, retain = false) {
  if (mqttClient.connected) {
    let data = null
    if (dataVal != null) {
      data = {
        ts: new Date(),
        name: name,
        val: dataVal
      }
    }
    mqttClient.publish(topic, JSON.stringify(data), {retain: retain})
    log.debug('Published to %s', topic)
  } else {
    log.debug('Couldn\'t publish to %s because not connected', topic)
  }
}

// This function is used to check certain input parameters to be numbers
function IsNumeric (val) {
  return !isNaN(parseInt(val))
}

start()
