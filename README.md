# Sonos2mqtt

[![npm](https://img.shields.io/npm/v/sonos2mqtt.svg?style=flat-square)](https://www.npmjs.com/package/sonos2mqtt)
[![travis](https://img.shields.io/travis/svrooij/sonos2mqtt.svg?style=flat-square)](https://travis-ci.org/svrooij/sonos2mqtt)
[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![Support me on Patreon][badge_patreon]][patreon]
[![PayPal][badge_paypal_donate]][paypal-donations]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This node.js application is a bridge between the Sonos and a mqtt server. The status of all your sonos devices will be published to mqtt and you can control the sonos speakers over mqtt.

It's intended as a building block in heterogenous smart home environments where an MQTT message broker is used as the centralized message bus. See [MQTT Smarthome on Github](https://github.com/mqtt-smarthome/mqtt-smarthome) for a rationale and architectural overview.

Check out the other bridges in the [software list](https://github.com/mqtt-smarthome/mqtt-smarthome/blob/master/Software.md)

## Installation

Using sonos2mqtt is really easy, but it requires at least [Node.js](https://nodejs.org/) v8 or higher, because of it's async usage. (This app is tested against v8 and v9).

`sudo npm install -g sonos2mqtt`

## Usage

```bash
sonos2mqtt 0.0.0-development
A smarthome bridge between your sonos system and a mqtt server.

Usage: sonos2mqtt [options]

Options:
  -v, --verbosity         Verbosity level
                   [choices: "error", "warn", "info", "debug"] [default: "info"]
  -n, --name              instance name. used as mqtt client id and as prefix
                          for connected topic                 [default: "sonos"]
  -u, --url               mqtt broker url. See
                          https://github.com/mqttjs/MQTT.js#connect-using-a-url
                                                   [default: "mqtt://127.0.0.1"]
  -d, --publish-distinct  Publish distinct track states
                                                      [boolean] [default: false]
  -h, --help              Show help                                    [boolean]
  --version               Show version number                          [boolean]
```

### MQTT Url

Use the MQTT url to connect to your specific mqtt server. Check out [mqtt.connect](https://github.com/mqttjs/MQTT.js#connect) for the full description.

```txt
Connection without port (port 1883 gets used)
[protocol]://[address] (eg. mqtt://127.0.0.1)

Connection with port
[protocol]://[address]:[port] (eg. mqtt://127.0.0.1:1883)

Secure connection with username/password and port
[protocol]://[username]:[password]@[address]:[port] (eg. mqtts://myuser:secretpassword@127.0.0.1:8883)
```

## Topics

Every message starts with a prefix (see [usage](#usage)) that defaults to `sonos`. So if you change this all the topics change.

### Connect messages

This bridge uses the `sonos/connected` topic to send retained connection messages. Use this topic to check your sonos bridge is still running.

* `0` or missing is not connected (set by will functionality).
* `1` is connected to mqtt, but not to any sonos device.
* `2` is connected to mqtt and at least one sonos speaker. (ultimate success!)

### Status messages

The status of each speaker will be published to `sonos/status/speaker_name/subtopic` as a JSON object containing the following fields.

* `val` The value for this subtopic
* `name` The name of the speaker
* `ts` Timestamp of this message

By default you can subscribe to the following subtopics `state` (retained), `volume` (retained), `muted` (retaind) and `track` (not retained) but if you wish to have separate topics for the track values you can specify the `-d` or `--publish-distinct` parameter and you will get the `artist` `title` `album` and `albumart` topics.

### Controlling sonos

You can control sonos by sending an empty message on these topics. The topic format is like `sonos/set/room_name/command` for instance `sonos/set/Office/next`.

Speaker commands:

* `next` - Play the next song
* `previous` - Play the previous song
* `pause` - Pause playing
* `play` - Resume playback
* `toggle` - Toggle between `pause` and `play`
* `stop` - Stop playback (you better use pause!)
* `volume` (payload requires number) - Set the volume to certain level between 0 and 100
* `volumeup` (payload number optional) - Increse the volume by number from payload or by 5
* `volumedown` (payload number optional) - Decrese the volume by number from payload or by 5
* `mute` - Mute the volume
* `unmute` - Unmute the volume
* `sleep` (payload requires number) - Set a sleeptimer for x amount of minutes (from payload)
* `notify` - Play a **notification** on this device :tada: (and revert to current state) see [parameters](https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosplaynotificationoptions)
* `queue` - add a song to the queue, payload should be json string or uri. See [parameters](https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosqueueoptions-positioninqueue)
* `setavtransporturi` - See [parameters](https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonossetavtransporturioptions)
* `joingroup` - Join a group by device name, payload should be a string with the name of the deivce to join.
* `leavegroup` - Leave a group.
* `playmode` - Set the playmode,payload should be *NORMAL*, *REPEAT_ALL*, *SHUFFLE* or *SHUFFLE_NOREPEAT*.

### Generic commands

There are also some genir commands not tied to a specific speaker. These generic commands should be send to `sonos/cmd/command` like `sonos/cmd/pauseall`.

Generic commands:

* `pauseall` - Pause all speakers know to the bridge.
* `listalarms` - This will fetch all the current alarms and sends them to `sonos/alarms`.
* `setalarm` - This allows you to set/unset an alarm. Requires json object with `id` and `enabled`
* `notify` - Play a notification on all devices (and revert to current state) see [parameters](https://github.com/bencevans/node-sonos/blob/master/docs/sonos.md#sonossonosplaynotificationoptions)

#### Notification sample

To play a notification on all devices you send the following json string to `sonos/cmd/notify`

```json
{
  "uri": "https://archive.org/download/Doorbell_1/doorbell.mp3",
  "volume": 10
}
```

## Use [PM2](http://pm2.keymetrics.io) to run in background

If everything works as expected, you should make the app run in the background automatically. Personally I use PM2 for this. And they have a great [guide for this](http://pm2.keymetrics.io/docs/usage/quick-start/).

## Node-sonos

This library depends on [node-sonos](https://github.com/bencevans/node-sonos/) that I just completly promistified. All other libraries using node-sonos should also be able to implemented all the nice features included there. Like **notifications** which is the coolest new addition for **sonos2mqtt**!

## Beer

This bridge and [my work](https://github.com/bencevans/node-sonos/pull/195) on the sonos library took me quite some time, so I invite everyone using this bridge to [Buy me a beer](https://svrooij.nl/buy-me-a-beer/).

## Special thanks

The latest version of this bridge is inspired on [hue2mqtt.js](https://github.com/hobbyquaker/hue2mqtt.js) by [Sabastian Raff](https://github.com/hobbyquaker). That was a great sample on how to create a globally installed, command-line, something2mqtt bridge.

[badge_paypal_donate]: https://svrooij.nl/badges/paypal_donate.svg
[badge_patreon]: https://svrooij.nl/badges/patreon.svg
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=T9XFJYUSPE4SG
[patreon]: https://www.patreon.com/svrooij