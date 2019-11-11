#!/usr/bin/env node

const pkg = require('../package.json')
const log = require('yalm')
const config = require('./config.js')
const mqtt = require('mqtt')
const SonosManager = require('@svrooij/sonos').SonosManager
const SonosEvents = require('@svrooij/sonos').SonosEvents

let mqttClient
const devices = []

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
  const sonosManager = new SonosManager()
  sonosManager.InitializeWithDiscovery()
    .then(success => {
      if (success) {
        sonosManager.Devices.forEach(d => addDevice(d))
        publishConnectionStatus()
      } else {
        log.info('No devices found')
      }
    })
  // search = s.DeviceDiscovery({ timeout: 4000 })
  // search.on('DeviceAvailable', async (device, model) => {
  //   log.debug('Found device (%s) with IP: %s', model, device.host)

  //   device.getZoneAttrs()
  //     .then(attrs => {
  //       const name = attrs.CurrentZoneName.toLowerCase().replace(' ', '-')
  //       log.info('Found player (%s): %s with IP: %s', model, name, device.host)
  //       device.name = name
  //       // hosts.push(host)
  //       addDevice(device)
  //     })
  //     .catch(err => {
  //       log.error('Get Zone error ', err)
  //     })
  // })
  // search.on('timeout', () => {
  //   publishConnectionStatus()
  //   s.Listener.on('AlarmClock', listAlarms)
  // })

  process.on('SIGINT', async () => {
    log.info('Shutting down listeners, please wait')
    devices.forEach(d => cancelSubscriptions(d))
    setTimeout(() => { process.exit(0) }, 3000)
  })
}

// This function will receive all incoming messages from MQTT
async function handleIncomingMessage (topic, payload) {
  payload = payload.toString()
  log.debug('Incoming message to %s %j', topic, payload)

  const parts = topic.toLowerCase().split('/')

  // Commands for devices
  if (parts[1] === 'set' && parts.length === 4) {
    const device = devices.find((device) => { return cleanName(device.Name) === parts[2].toLowerCase() })
    if (device) {
      return handleDeviceCommand(device, parts[3], payload)
        .then(result => {
          log.debug('Executed %s for %s result: %j', parts[3], device.Name, result)
        })
        .catch(err => {
          log.error('Error executing %s for %s %j', parts[3], device.Name, err)
        })
    } else {
      log.error('Device with name %s not found', parts[2])
    }
  } else if (parts[1] === 'cmd' && parts.length === 3) {
    return handleGenericCommand(parts[2], payload)
      .then(result => {
        log.debug('Executed %s result: %j', parts[2], result)
      })
      .catch(err => {
        log.error('Error executing %s %j', parts[2], err)
      })
  }
}

// This function is called when a device command is recognized by 'handleIncomingMessage'
async function handleDeviceCommand (device, command, payload) {
  log.debug('Incoming device command %s for %s payload %s', command, device.name, payload)
  let commandData
  switch (command) {
    // ------------------ Playback commands
    case 'next':
      return device.Next()
    case 'pause':
    case 'pauze':
      return device.Pause()
    case 'play':
      return device.Play()
    case 'toggle': // TODO Toggle playback support
      return device.togglePlayback()
    case 'previous':
      return device.Previous()
    case 'stop':
      return device.Stop()
    case 'selecttrack':
      if (IsNumeric(payload)) {
        return device.SeeKTrack(parseInt(payload))
      } else {
        log.error('Payload isn\'t a number')
        break
      }
    case 'seek':
      return device.SeekPosition(payload)
    // ------------------ Volume commands
    case 'volume':
      if (IsNumeric(payload)) {
        var vol = parseInt(payload)
        if (vol >= 0 && vol <= 100) {
          return device.RenderingControlService.SetVolume({ InstanceID: 0, Channel: 'Master', DesiredVolume: vol })
        }
      } else {
        log.error('Payload for setting volume is not numeric')
      }
      break
    case 'volumeup':
      return handleVolumeCommand(device, payload, 1)
    case 'volumedown':
      return handleVolumeCommand(device, payload, -1)
    case 'mute':
      return device.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: true })
    case 'unmute':
      return device.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: false })
    // ------------------ Sleeptimer
    case 'sleep':
      if (IsNumeric(payload)) {
        var minutes = parseInt(payload)
        if (minutes > 0 && minutes < 1000) {
          return device.AVTransportService.ConfigureSleepTimer({ InstanceID: 0, NewSleepTimerDuration: minutes.toString() }).then(result => {
            log.debug('Sleeptimer set %j', result)
          })
        }
      } else {
        log.error('Payload for setting sleeptimer is not numeric')
      }
      break
    // ------------------ Queue a song to play next accepts string or json object
    case 'queue':
      return device.queue(ConvertToObjectIfPossible(payload))
    // ----------------- Possibly the coolest feature of this library, play a notification and revert back to old state see https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosplaynotificationoptions for parameters
    case 'notify':
      return device.playNotification(ConvertToObjectIfPossible(payload))
    // ----------------- This is an advanced feature to set the playback url
    case 'setavtransporturi':
      return device.setAVTransportURI(ConvertToObjectIfPossible(payload))
    case 'radio':
      return handleRadioCommand(device, ConvertToObjectIfPossible(payload))
    case 'joingroup':
      return device.JoinGroup(payload)
    case 'leavegroup':
      return device.AVTransportService.BecomeCoordinatorOfStandaloneGroup()
    case 'playmode':
      return device.setPlayMode(payload)
    case 'command':
      commandData = ConvertToObjectIfPossible(payload)
      log.debug('OneCommand endpoint %j', commandData)
      if (commandData.cmd) {
        return handleDeviceCommand(device, commandData.cmd, commandData.val)
      } else {
        log.warning('Command not set in payload')
        break
      }
    default:
      log.debug('Command %s not yet supported', command)
      break
  }
}

// This function is used by 'handleDeviceCommand' for handeling Tunein
async function handleRadioCommand (device, payload) {
  return device.playTuneinRadio(payload.stationId, payload.stationTitle).then(success => {
    log.info('Radio station changed %s', payload.stationTitle)
  }).catch(err => { log.error('Error occurred %j', err) })
}

// This function is used by 'handleDeviceCommand' for handeling the volume up/down commands
async function handleVolumeCommand (device, payload, modifier) {
  let change = 5
  if (payload !== null) {
    if (IsNumeric(payload)) {
      const tempIncrement = parseInt(payload)
      if (tempIncrement > 0 && tempIncrement < 100) {
        change = tempIncrement
      }
    }
  }

  return device.RenderingControlService.SetRelativeVolume({ InstanceID: 0, Channel: 'Master', Adjustment: (change * modifier) })
    .then(result => {
      log.info('Volume changed %d to %d', (change * modifier), result.NewVolume)
      return result.NewVolume
    })
}

// This function is called when a generic command is recognized by 'handleIncomingMessages'
async function handleGenericCommand (command, payload) {
  let parsedPayload
  switch (command) {
    // ------------------ Alarms
    case 'listalarms':
      return listAlarms()
    case 'setalarm':
      return setalarm(ConvertToObjectIfPossible(payload))
    // ------------------ Control all devices
    case 'pauseall':
      return Promise.all(devices.map(d => d.Pause()))
    // ------------------ Play a notification on all devices, see https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosplaynotificationoptions for parameters
    case 'notify':
      parsedPayload = ConvertToObjectIfPossible(payload)
      return Promise.all(devices.map(d => d.PlayNotification(parsedPayload)))
    default:
      log.error('Command %s isn\' implemented', command)
      break
  }
}

// Loading the alarms and publishing them to 'sonos/alarms'
async function listAlarms () {
  return devices[0].alarmClockService().ListAlarms().then(alarms => {
    log.debug('Got alarms %j', alarms)
    mqttClient.publish(config.name + '/alarms', JSON.stringify(alarms), { retain: false })
  })
}
async function setalarm (payload) {
  payload = ConvertToObjectIfPossible(payload)
  if (payload.id && payload.enabled) {
    return devices[0].alarmClockService().SetAlarm(payload.id, payload.enabled)
  }
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
async function addDevice (device) {
  await device.LoadDeviceData()
  // Start listening for those events!
  device.Events.on(SonosEvents.CurrentTrack, trackUri => {
    publishTrackUri(device, trackUri)
  })
  device.Events.on(SonosEvents.CurrentTrackMetadata, metadata => {
    publishCurrentTrack(device, metadata)
  })
  device.Events.on(SonosEvents.CurrentTransportState, state => {
    publishState(device, state)
  })
  device.Events.on(SonosEvents.Mute, muted => {
    publishMuted(device, muted)
  })
  device.Events.on(SonosEvents.Volume, volume => {
    publishVolume(device, volume)
  })

  devices.push(device)
}

function cancelSubscriptions (device) {
  device.Event.removeAllListeners(SonosEvents.CurrentTrack)
  device.Event.removeAllListeners(SonosEvents.CurrentTrackMetadata)
  device.Event.removeAllListeners(SonosEvents.CurrentTransportState)
  device.Event.removeAllListeners(SonosEvents.Mute)
  device.Event.removeAllListeners(SonosEvents.Volume)
}

function cleanName (name) {
  return name.toLowerCase().replace(/\s/g, '-')
}

// Used by event handler
function publishVolume (device, volume) {
  publishData(`${config.name}/status/${cleanName(device.Name)}/volume`, volume, cleanName(device.Name), true)
}

// Used by event handler
function publishMuted (device, muted) {
  publishData(`${config.name}/status/${cleanName(device.Name)}/muted`, muted, cleanName(device.Name), true)
}

// Used by event handler
function publishState (device, state) {
  publishData(`${config.name}/status/${cleanName(device.Name)}/state`, state, cleanName(device.Name), true)
}

function publishTrackUri (device, trackUri) {
  publishData(`${config.name}/status/${cleanName(device.Name)}/trackUri`, trackUri, device.Name)
}

// Used by event handler
function publishCurrentTrack (device, track) {
  log.debug('New track data for %s %j', device.Name, track)
  if (config.publishDistinct) {
    publishData(`${config.name}/status/${cleanName(device.Name)}/title`, track.Title, device.Name)
    publishData(`${config.name}/status/${cleanName(device.Name)}/artist`, track.Artist, device.Name)
    publishData(`${config.name}/status/${cleanName(device.Name)}/album`, track.Album, device.Name)
    publishData(`${config.name}/status/${cleanName(device.Name)}/albumart`, track.AlbumArtURI, device.Name)
    publishData(`${config.name}/status/${cleanName(device.Name)}/trackUri`, track.TrackUri, device.Name)
  } else {
    const val = (track && track.Title) ? {
      title: track.Title,
      artist: track.Artist,
      album: track.Album,
      albumArt: track.AlbumArtURI,
      trackUri: track.TrackUri
    } : null

    publishData(`${config.name}/status/${cleanName(device.Name)}/track`, val, device.name)
  }
}

// This function will format the data before publishing to mqtt
function publishData (topic, dataVal, name = null, retain = false) {
  if (mqttClient.connected) {
    let data = null
    if (dataVal != null) {
      data = {
        ts: Date.now(),
        name: name,
        val: dataVal
      }
    }
    mqttClient.publish(topic, JSON.stringify(data), { retain: retain })
    log.debug('Published to %s', topic)
  } else {
    log.debug('Couldn\'t publish to %s because not connected', topic)
  }
}

// This function is used to check certain input parameters to be numbers
function IsNumeric (val) {
  return !isNaN(parseInt(val))
}

function ConvertToObjectIfPossible (input) {
  try {
    return JSON.parse(input)
  } catch (e) {
    log.debug('Error parsing json %j', e)
  }
  return input
}

start()
