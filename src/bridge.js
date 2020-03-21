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

  if (config['tts-endpoint'] !== undefined && process.env.SONOS_TTS_ENDPOINT === undefined) {
    process.env.SONOS_TTS_ENDPOINT = config['tts-endpoint']
  }

  // MQTT Stuff
  log.info('Parsing url %s', config.mqtt)
  const url = new URL(config.mqtt)

  // Define the will message (is send on disconnect).
  const mqttOptions = {
    will: {
      topic: config.name + '/connected',
      message: 0,
      qos: 0,
      retain: true
    },
    port: url.port,
    protocol: url.protocol,
    host: url.hostname,
    username: url.username,
    password: url.password,
    keepalive: 10000
  }

  mqttClient = mqtt.connect(mqttOptions)

  mqttClient.on('connect', () => {
    log.info('Connected to mqtt %s', config.mqtt)
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
  log.debug('Current config %o', config)
  if (config.device) log.info('Start from device %s', config.device)
  else log.info('Start searching for devices')
  const sonosManager = new SonosManager()
  // Pick the right initialization function.
  const initialize = config.device ? sonosManager.InitializeFromDevice(config.device) : sonosManager.InitializeWithDiscovery(10)
  initialize
    .then(success => {
      if (success) {
        sonosManager.Devices.forEach(d => addDevice(d))
        publishConnectionStatus()
      } else {
        log.info('No devices found')
      }
    })
    .catch(err => {
      log.error('Error in device discovery %o', err)
      process.exit(300)
    })

  process.on('SIGINT', async () => {
    log.info('Shutting down listeners, please wait')
    devices.forEach(d => cancelSubscriptions(d))
    setTimeout(() => { process.exit(0) }, 800)
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
  const parsedPayload = ConvertToObjectIfPossible(payload)
  switch (command) {
    // ------------------ Playback commands
    case 'next':
      return device.Next()
    case 'pause':
    case 'pauze':
      return device.Pause()
    case 'play':
      return device.Play()
    case 'toggle':
      return device.TogglePlayback()
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
      return typeof parsedPayload === 'string' ? device.AddUriToQueue(parsedPayload) : device.AddUriToQueue(parsedPayload.trackUri, parsedPayload.positionInQueue, parsedPayload.enqueueAsNext)
    // ----------------- Possibly the coolest feature of this library, play a notification and revert back to old state see https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosplaynotificationoptions for parameters
    case 'notify':
      return device.PlayNotification(parsedPayload)
    // ----------------- This is an advanced feature to set the playback url
    case 'speak':
      if (parsedPayload.endpoint === undefined && config['tts-endpoint'] === undefined && process.env.SONOS_TTS_ENDPOINT === undefined) {
        log.warning('Either specify the endpoint in the payload, the config or set env SONOS_TTS_ENDPOINT')
        break
      }
      if (parsedPayload.lang === undefined) parsedPayload.lang = config['tts-lang']
      if (parsedPayload.endpoint === undefined && config['tts-endpoint'] !== undefined) parsedPayload.endpoint = config['tts-endpoint']
      return device.PlayTTS(parsedPayload)
    case 'setavtransporturi':
      return device.SetAVTransportURI(payload)
    case 'joingroup':
      return device.JoinGroup(payload)
    case 'leavegroup':
      return device.AVTransportService.BecomeCoordinatorOfStandaloneGroup()
    case 'playmode':
      return device.AVTransportService.SetPlayMode({ InstanceID: 0, NewPlayMode: payload })
    case 'command':
      log.debug('OneCommand endpoint %j', parsedPayload)
      if (parsedPayload.cmd) {
        return handleDeviceCommand(device, parsedPayload.cmd, parsedPayload.val)
      } else {
        log.warning('Command not set in payload')
        break
      }
    case 'adv-command':
      // This is a command send to the sonos lib directly, see https://github.com/svrooij/node-sonos-ts#commands
      if (parsedPayload.cmd) {
        return device.ExecuteCommand(parsedPayload.cmd, parsedPayload.val)
      } else {
        log.warning('Command not set in payload')
        break
      }
    default:
      log.debug('Command %s not yet supported', command)
      break
  }
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
      log.info('Volume changed with %d to %d', (change * modifier), result.NewVolume)
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
  return devices[0].AlarmClockService.ListAndParseAlarms().then(alarms => {
    log.debug('Got alarms %j', alarms)
    mqttClient.publish(config.name + '/alarms', JSON.stringify(alarms), { retain: false })
    return true
  })
}
async function setalarm (payload) {
  if (payload.id !== null && payload.enabled !== null) {
    return devices[0].AlarmClockService.PatchAlarm({ ID: payload.id, Enabled: payload.enabled === true })
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
function addDevice (device) {
  log.info('Add device %s %s', device.Name, device.host)
  // Start listening for those events!
  device.Events.on(SonosEvents.CurrentTrackUri, trackUri => {
    publishTrackUri(device, trackUri)
  })
  device.Events.on(SonosEvents.CurrentTrackMetadata, metadata => {
    publishCurrentTrack(device, metadata)
  })
  device.Events.on(SonosEvents.CurrentTransportStateSimple, state => {
    publishState(device, state)
  })
  device.Events.on(SonosEvents.Mute, muted => {
    publishMuted(device, muted)
  })
  device.Events.on(SonosEvents.Volume, volume => {
    publishVolume(device, volume)
  })

  device.Events.on(SonosEvents.GroupName, groupName => {
    publishData(`${config.name}/status/${cleanName(device.Name)}/group`, groupName, cleanName(device.Name), true)
  })

  device.Events.on(SonosEvents.Coordinator, coordinator => {
    publishData(`${config.name}/status/${cleanName(device.Name)}/coordinator`, coordinator, cleanName(device.Name), true)
  })

  devices.push(device)
}

function cancelSubscriptions (device) {
  device.Events.removeAllListeners(SonosEvents.CurrentTrackUri)
  device.Events.removeAllListeners(SonosEvents.CurrentTrackMetadata)
  device.Events.removeAllListeners(SonosEvents.CurrentTransportState)
  device.Events.removeAllListeners(SonosEvents.Mute)
  device.Events.removeAllListeners(SonosEvents.Volume)
  device.Events.removeAllListeners(SonosEvents.GroupName)
  device.Events.removeAllListeners(SonosEvents.Coordinator)
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
    publishData(`${config.name}/status/${cleanName(device.Name)}/albumart`, track.AlbumArtUri, device.Name)
    publishData(`${config.name}/status/${cleanName(device.Name)}/trackUri`, track.TrackUri, device.Name)
  } else {
    const val = (track && track.Title) ? {
      title: track.Title,
      artist: track.Artist,
      album: track.Album,
      albumArt: track.AlbumArtUri,
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
