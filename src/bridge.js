#!/usr/bin/env node

const pkg = require('../package.json')
const log = require('yalm')
const config = require('./config.js')
// const parser = require('xml2json')
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
  })

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
  search.on('DeviceAvailable', function (device, model) {
    log.debug('Found device (%s) with IP: %s', model, device.host)

    device.getZoneAttrs(function (err, attrs) {
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
  search.on('timeout', function () {
    publishConnectionStatus()
  })

  process.on('SIGINT', function () {
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
    setTimeout(function () {
      process.exit()
    }, 2000)
  })
}

// var mqttConnected

// var search = s.search()

// var devices = []
// var listener = []
// var hosts = []

// search.on('DeviceAvailable', function (device) {
//   log.debug('Start searching for Sonos devices')

//   var host = {}
//   host.ip = device.host

//   device.getZoneAttrs(function (err, attrs) {
//     if (err) {
//       log.error('Get Zone error ', err)
//       return
//     }
//     host.name = attrs.CurrentZoneName
//     log.info('Found: ' + host.name + ' with IP: ' + host.ip)
//     hosts.push(host)
//   })
// })

// setTimeout(function () {
//   log.info('Stop searching for Sonos devices')
//   search.destroy()
//   for (var v = 0; v < hosts.length; v++) {
//     devices.push(createDevices(hosts[v]))
//     listener.push(createListener(devices[v]))
//   }
// }, 1000)

// function createDevices (host) {
//   var newDevice = {}

//   newDevice.sonos = new s.Sonos(host.ip)
//   newDevice.name = host.name

//   return newDevice
// }

// function createListener (dev) {
//   var listenerObj = {}
//   var device = dev
// // TODO: improve multiple listeners
//   device.listener1 = new s.Listener(device.sonos, {'interface': 'public'})
//   device.listener2 = new s.Listener(device.sonos, {'interface': 'public'})
//   device.listener3 = new s.Listener(device.sonos, {'interface': 'public'})
//   device.listener4 = new s.Listener(device.sonos, {'interface': 'public'})

//   device.listener1.listen(function (err) {
//     if (err) throw err

//     device.listener1.addService('/MediaRenderer/AVTransport/Event', function (error, sid) {
//       if (error) throw err
//       log.debug('AV, with subscription id', sid)
//     })

//     device.listener1.on('serviceEvent', function (endpoint, sid, data1) {
//       if (mqttConnected) {
//                 // It's a shame the data isn't in a nice track object, but this might need some more work.
//         log.debug('Received event from', endpoint, '(' + sid + ') with data:', data1, '\n\n')
//                 // At this moment we know something is changed, either the play state or an other song.

//         var data = {}

//         device.sonos.getCurrentState(function (err, state) {
//           if (err) {
//             log.error('Error getting state ', err)
//             return
//           }
//           log.debug('State: ', state)

//           data.val = state
//           mqtt.publish(config.name + '/status/' + device.name + '/state', JSON.stringify(data), {retain: false})
//         })
//         device.sonos.currentTrack(function (err, track) {
//           if (err) {
//             log.error('Error getting current track', err)
//             return
//           }
//           log.debug('TRACK', track)

//           publishCurrentTrack(device.name, track)
//           // data.val = track.title
//           // mqtt.publish(config.name + '/status/' + device.name + '/title', JSON.stringify(data), {retain: false})

//           // data.val = track.artist
//           // mqtt.publish(config.name + '/status/' + device.name + '/artist', JSON.stringify(data), {retain: false})

//           // data.val = track.album
//           // mqtt.publish(config.name + '/status/' + device.name + '/album', JSON.stringify(data), {retain: false})

//           // data.val = track.albumArtURL
//           // mqtt.publish(config.name + '/status/' + device.name + '/url', JSON.stringify(data), {retain: false})
//         })
//         mqtt.publish(config.name + '/listener/1', '', {retain: false})
//       }
//     })
//   })
//   device.listener2.listen(function (err) {
//     if (err) throw err

//     device.listener2.addService('/AlarmClock/Event', function (error, sid) {
//       if (error) throw err
//       log.debug('AC, with subscription id', sid)
//     })
//     device.listener2.on('serviceEvent', function (endpoint, sid, data1) {
//       if (mqttConnected) {
//                 // Get Alarmlist
//         log.info('GET')
//         getCommand(device.sonos, 'LISTALARM', {})
//         mqtt.publish(config.name + '/listener/2', '', {retain: false})
//       }
//     })
//   })
//   device.listener3.listen(function (err) {
//     if (err) throw err

//     device.listener3.addService('/ZoneGroupTopology/Event', function (error, sid) {
//       if (error) throw err
//       log.debug('ZGT, with subscription id', sid)
//     })

//     device.listener3.on('serviceEvent', function (endpoint, sid, data1) {
//       if (mqttConnected) {
//                 // It's a shame the data isn't in a nice track object, but this might need some more work.
//         log.debug('Received event from', endpoint, '(' + sid + ') with data:', data1, '\n\n')
//                 // At this moment we know something is changed, either the play state or an other song.

//                 // TODO: send out when zone changed
//         mqtt.publish(config.name + '/status/zone', 'to be implemented', {retain: true})
//         mqtt.publish(config.name + '/listener/3', '', {retain: false})
//       }
//     })
//   })
//   device.listener4.listen(function (err) {
//     if (err) throw err

//     device.listener4.addService('/MediaRenderer/RenderingControl/Event', function (error, sid) {
//       if (error) throw err
//       log.debug('RC, with subscription id', sid)
//     })

//     device.listener4.on('serviceEvent', function (endpoint, sid, data1) {
//       if (mqttConnected) {
//                 // It's a shame the data isn't in a nice track object, but this might need some more work.
//         log.debug('Received event from', endpoint, '(' + sid + ') with data:', data1, '\n\n')
//                 // At this moment we know something is changed, either the play state or an other song.

//         var data = {}

//         device.sonos.getMuted(function (err, mute) {
//           if (err) {
//             log.error('Error getting mute state ', err)
//             return
//           }
//           data.val = mute
//           mqtt.publish(config.name + '/status/' + device.name + '/mute', JSON.stringify(data), {retain: false})
//           log.debug('MUTE: ', mute)
//         })
//         device.sonos.getVolume(function (err, vol) {
//           if (err) {
//             log.error('Error getting volume ', err)
//             return
//           }
//           data.val = vol
//           mqtt.publish(config.name + '/status/' + device.name + '/volume', JSON.stringify(data), {retain: false})
//           log.debug('Vol: ', vol)
//         })
//       }
//     })
//   })

//   listenerObj.listener1 = device.listener1
//   listenerObj.listener2 = device.listener2
//   listenerObj.listener3 = device.listener3
//   listenerObj.listener4 = device.listener4
//   return listenerObj
// }

// // log.setLevel(config.verbosity)

// // log.info(pkg.name + ' ' + pkg.version + ' starting')
// // log.info('mqtt trying to connect', config.url)

// var mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0', retain: true}})

// mqtt.on('connect', function () {
//   mqttConnected = true

//   log.info('mqtt connected', config.url)
//   mqtt.publish(config.name + '/connected', '1', {retain: true}) // TODO eventually set to '2' if target system already connected

//   log.info('mqtt subscribe', config.name + '/set/#')
//   mqtt.subscribe(config.name + '/set/#')

//   log.info('mqtt subscribe', config.name + '/get/#')
//   mqtt.subscribe(config.name + '/get/#')
// })

// mqtt.on('close', function () {
//   if (mqttConnected) {
//     mqttConnected = false
//     log.info('mqtt closed ' + config.url)
//   }
// })

// mqtt.on('error', function (err) {
//   log.error('mqtt', err)
// })

// mqtt.on('message', function (topic, payload) {
//   try {
//     payload = JSON.parse(payload.toString())
//   } catch (e) {
//     log.error('Error parsing payload', e)
//     payload = null
//   }

//   log.info('mqtt <', topic, payload)

//   var parts = topic.toUpperCase().split('/')

//   log.debug('part0: ' + parts[0])
//   log.debug('part1: ' + parts[1])
//   log.debug('part2: ' + parts[2])
//   log.debug('part3: ' + parts[3])
//   log.debug('part4: ' + parts[4])

//   var device
//   for (var y = 0; y < devices.length; y++) {
//     if (devices[y].name.toUpperCase() === parts[2]) {
//       device = devices[y].sonos
//     }
//   }

//   if (device) {
//     if (parts[1] === 'SET') {
//       setCommand(device, parts[3], payload)
//     } else if (parts[1] === 'GET') {
//       log.debug('Get2')
//       getCommand(device, parts[3], payload)
//     }
//   }
// })

// function getCommand (device, command, payload) {
//   switch (command) {
//     case 'LISTALARM':

//       var alarmClock = new s.Services.AlarmClock((device.host))
//       alarmClock.ListAlarms({}, function (err, res) {
//         if (err) {
//           log.error('Error listing alarms ', err)
//           return
//         }
//         var data = {}
//         data.val = JSON.parse(parser.toJson(res.CurrentAlarmList)).Alarms.Alarm
//         // log.debug('Current alarms', data.val)
//         mqtt.publish(config.name + '/status/alarmlist', JSON.stringify(data), {retain: false})
//       })
//       break
//   }
// }

// function setCommand (device, command, payload) {
//   switch (command) {
//     case 'PLAY':
//       device.play(function (err, res) {
//         log.debug([err, res])
//       })
//       break
//     case 'PAUSE':
//       device.pause(function (err, res) {
//         log.debug([err, res])
//       })
//       break
//     case 'NEXT':
//       device.next(function (err, res) {
//         log.debug([err, res])
//       })
//       break
//     case 'PREVIOUS':
//       device.previous(function (err, res) {
//         log.debug([err, res])
//       })
//       break
//     case 'PLAYPAUSE':
//       device.getCurrentState(function (err, state) {
//         log.debug([err, state])

//         if (state.toString() === 'playing') {
//           device.pause(function (err, res) {
//             log.debug([err, res])
//           })
//         } else {
//           device.play(function (err, res) {
//             log.debug([err, res])
//           })
//         }
//       })
//       break
//     case 'STOP':
//       device.stop(function (err, res) {
//         log.debug([err, res])
//       })
//       break
//     case 'VOLUMEUP':
//       device.getVolume(function (err, vol) {
//         if (err) {
//           log.error('Error getting volume', err)
//           return
//         }
//         var increment = 5
//         if (payload && payload.val) {
//           var tempIncrement = parseInt(payload.val)
//           if (tempIncrement > 0 && tempIncrement < 100) {
//             increment = tempIncrement
//           }
//         }
//         var newVolume = vol + increment
//         log.info('Old volume %d, increment %d, new volume %d', vol, increment, newVolume)
//         if (newVolume > 100) {
//           newVolume = 100
//         }

//         device.setVolume(newVolume, function (err, res) {
//           if (err) {
//             log.error('Error setting volume ', err)
//             return
//           }
//           log.debug([err, res])
//           log.info('vol: ' + newVolume)
//         })
//       })
//       break
//     case 'VOLUMEDOWN':
//       device.getVolume(function (err, vol) {
//         if (err) {
//           log.error('Error getting volume ', err)
//           return
//         }
//         var decrement = 5
//         if (payload && payload.val) {
//           var tempDecrement = parseInt(payload.val)
//           if (tempDecrement > 0 && tempDecrement < 100) {
//             decrement = tempDecrement
//           }
//         }
//         var newVolume = vol - decrement
//         log.info('Old volume %d, decrement %d, new volume %d', vol, decrement, newVolume)

//         device.setVolume(newVolume, function (err, res) {
//           log.debug([err, res])
//           log.info('vol: ' + newVolume)
//         })
//       })
//       break
//     case 'VOLUME':
//       var vol = parseInt(payload.val)
//       log.info('vol: ' + vol)
//       if ((!(vol < 0)) && (!(vol > 100)) && !(isNaN(vol))) {
//         device.setVolume(vol, function (err, res) {
//           log.debug([err, res])
//         })
//       }
//       break
//     case 'PLAYLIST':
//             // TODO: to be implemented
//       break
//     case 'PLAYURL':
//             // TODO: to be implemented
//       break
//     case 'GROUP' :
//             // TODO: to be implemented
//       break
//     case 'UNGROUP' :
//             // TODO: to be implemented
//       break
//     case 'RADIO' :
//             // TODO: to be implemented
//       break
//     case 'MUTE':

//       if ((typeof payload.val === 'string' && (payload.val.toLowerCase() === 'true' || payload.val.toLowerCase() === '1')) || payload.val === 1 || payload.val === true) {
//         device.setMuted(true, function (err, res) {
//           log.debug([err, res])
//         })
//       } else if ((typeof payload.val === 'string' && (payload.val.toLowerCase() === 'false' || payload.val.toLowerCase() === '0')) || payload.val === 0 || payload.val === false) {
//         device.setMuted(false, function (err, res) {
//           log.debug([err, res])
//         })
//       }
//       break

//     case 'CREATEALARM' :
//             // TODO: to be implemented
//       break
//     case 'UPDATEALARM' :
//             // TODO: to be implemented
//       break
//     case 'DELETEALARM' :
//             // TODO: to be implemented
//       break
//     case 'SLEEPTIMER' :
//       var avTransport = new s.Services.AVTransport((device.host))
//       avTransport.ConfigureSleepTimer({
//         InstanceID: 0,
//         NewSleepTimerDuration: payload.val
//       }, function (err, playing) {
//         log.info([err, playing])
//       })

//       break
//   }
// }

function publishConnectionStatus () {
  let status = '1'
  if (devices.length > 0) { status = '2' }
  mqttClient.publish(config.name + '/connected', status, {
    qos: 0,
    retain: true
  })
}

function addDevice (device) {
  // Add a listerner to this device
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

function publishVolume (device, volume) {
  publishData(config.name + '/status/' + device.name + '/volume', volume, device.name, true)
}

function publishMuted (device, muted) {
  publishData(config.name + '/status/' + device.name + '/muted', muted, device.name, true)
}

function publishState (device, state) {
  publishData(config.name + '/status/' + device.name + '/state', state, device.name, true)
}

function publishCurrentTrack (device, track) {
  log.debug('Last track on %s %s', device.name, JSON.stringify(track))
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

// function IsNumeric (val) {
//   return Number(parseFloat(val)) === val
// }

start()
