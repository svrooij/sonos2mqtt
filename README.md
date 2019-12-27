# Sonos2mqtt

[![npm](https://img.shields.io/npm/v/sonos2mqtt.svg?style=flat-square)](https://www.npmjs.com/package/sonos2mqtt)
[![docker pulls][badge_docker]][link_docker]
[![Support me on Github][badge_sponsor]][link_sponsor]
[![github issues][badge_issues]][link_issues]
[![travis](https://img.shields.io/travis/svrooij/sonos2mqtt.svg?style=flat-square)](https://travis-ci.org/svrooij/sonos2mqtt)
[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg?style=flat-square)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This node.js application is a bridge between the Sonos and a mqtt server. The status of all your sonos devices will be published to mqtt and you can control the sonos speakers over mqtt.

It's intended as a building block in heterogenous smart home environments where an MQTT message broker is used as the centralized message bus. See [MQTT Smarthome on Github](https://github.com/mqtt-smarthome/mqtt-smarthome) for a rationale and architectural overview.

Check out the other bridges in the [software list](https://github.com/mqtt-smarthome/mqtt-smarthome/blob/master/Software.md)

## Run in docker

You can run **sonos2mqtt** in docker, but you'll need to remember the following. This library depends on receiving events from your sonos speakers, the events are required. Every setting of this library can also be set with environment variables prefixed with `SONOS2MQTT_`.

1. Create an `.env` file with the following settings.
2. Set the required values.
3. Run `docker run --env-file .env -p 6329:6329 svrooij/sonos2mqtt`

```Shell
# Set the IP of one known sonos speaker (device discovery doesnt always work inside docker.)
SONOS2MQTT_DEVICE=192.168.x.x
# Set the mqtt connection string
SONOS2MQTT_MQTT=mqtt://ip_or_host_of_mqtt
# Set the IP of the docker host (so node-sonos-ts knows where the events should be send to)
SONOS_LISTENER_HOST=192.168.x.x
# Set text-to-speech endpoint (optional)
# SONOS_TTS_ENDPOINT=https://tts.server.com/api/generate
```

## Installation

Using sonos2mqtt is really easy, but it requires at least [Node.js](https://nodejs.org/) v8 or higher, because of it's async usage. (This app is tested against v10 and v12).

`sudo npm install -g sonos2mqtt`

## Usage

```bash
sonos2mqtt 0.0.0-development
A smarthome bridge between your sonos system and a mqtt server.

Usage: sonos2mqtt [options]

Options:
  -v, --verbosity         Verbosity level
                   [choices: "error", "warn", "info", "debug"] [default: "info"]
  -i, --name              instance name. used as mqtt client id and as prefix
                          for connected topic                 [default: "sonos"]
  --mqtt                  mqtt broker url. See
                          https://github.com/mqttjs/MQTT.js#connect-using-a-url
                                                   [default: "mqtt://127.0.0.1"]
  -d, --publish-distinct  Publish distinct track states
                                                      [boolean] [default: false]
  -h, --help              Show help                                    [boolean]
  --tts-lang              Default TTS language                [default: "en-US"]
  --device                Start with one known IP instead of device discovery.
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

By default you can subscribe to the following subtopics `coordinator` (retained), `state` (retained), `volume` (retained), `muted` (retaind) and `track`/`trackUri` (not retained) but if you wish to have separate topics for the track values you can specify the `-d` or `--publish-distinct` parameter and you will get the `artist`, `title`, `album`, `trackUri` and `albumart` topics.

### Controlling sonos

You can control sonos by sending an empty message on these topics. The topic format is like `sonos/set/room_name/command` for instance `sonos/set/Office/next`.

Speaker commands:

* `next` - Play the next song
* `previous` - Play the previous song
* `pause` - Pause playing
* `play` - Resume playback
* `toggle` - Toggle between `pause` and `play`
* `stop` - Stop playback (you better use pause!)
* `selecttrack` (payload requires number) - Select an other track in the queue.
* `seek` - Skip to position in track, payload needs a relative time like `0:03:45` to skip to 3 min, 45 sec.
* `volume` (payload requires number) - Set the volume to certain level between 0 and 100
* `volumeup` (payload number optional) - Increse the volume by number from payload or by 5
* `volumedown` (payload number optional) - Decrese the volume by number from payload or by 5
* `mute` - Mute the volume
* `unmute` - Unmute the volume
* `sleep` (payload requires number) - Set a sleeptimer for x amount of minutes (from payload)
* `notify` - Play a **notification** on this device :tada: (and revert to current state) see [notifications](#notifications)
* `speak` - Generate text-to-speech file and play as notification :tada: (and revert to current state) see [text-to-speech](#text-to-speech)
* `queue` - add a song to the queue, should be an (sonos supported) uri.
* `setavtransporturi` - Set the current playback uri.
* `joingroup` - Join a group by device name, payload should be a string with the name of the deivce to join.
* `leavegroup` - Leave a group.
* `playmode` - Set the playmode,payload should be *NORMAL*, *REPEAT_ALL*, *SHUFFLE* or *SHUFFLE_NOREPEAT*.
* `command` - One topic for all [commands](https://github.com/svrooij/sonos2mqtt/issues/21). Payload like `{"cmd":"volumeup"}` or `{"cmd":"volume", "val":10}` for commands that need a payload.
* `adv-command` - Same as `command` but sends the command to the Sonos library, see [commands](https://github.com/svrooij/node-sonos-ts#commands)

### Generic commands

There are also some generic commands not tied to a specific speaker. These generic commands should be send to `sonos/cmd/command` like `sonos/cmd/pauseall`.

Generic commands:

* `pauseall` - Pause all speakers known to the bridge.
* `listalarms` - This will fetch all the current alarms and sends them to `sonos/alarms`.
* `setalarm` - This allows you to set/unset an alarm. Requires json object with `id` and `enabled`
* `notify` - Play a notification on all devices (and revert to current state) see [notifications](#notifications)

#### Notifications

To play a notification on all devices you send the following json string to `sonos/cmd/notify`

```json
{
  "trackUri": "https://cdn.smartersoft-group.com/various/pull-bell-short.mp3", // Can be any uri sonos understands
  // trackUri: 'https://cdn.smartersoft-group.com/various/someone-at-the-door.mp3', // Cached text-to-speech file.
  "onlyWhenPlaying": false, // make sure that it only plays when you're listening to music. So it won't play when you're sleeping.
  "timeout": 10, // If the events don't work (to see when it stops playing) or if you turned on a stream, it will revert back after this amount of seconds.
  "volume": 8
}
```

#### Text-to-speech

You can have your sonos speaker speak, which is a pretty cool feature. But you'll need some extra work. You'll need a text-to-speech endpoint as described [here](https://github.com/svrooij/node-sonos-ts#text-to-speech). You have two options either host your own [server](https://github.com/svrooij/node-sonos-tts-polly) or become a [sponsor][link_sponsor] and get access to my personal hosted TTS server.

Either way you'll have yourself a text-to-speech endpoint. This can be set in the environment as `SONOS_TTS_ENDPOINT` or you'll have to supply it with every request.

Have a speaker speak by sending the following to `sonos/set/device_name/speak`.

```json
{
  "text": "Someone at the front-door", // The text you want spoken.
  "endpoint": "https://your.tts.endpoint/api/generate", // Endpoint is required if not set in Environment
  "lang": "en-US", // (optional) Specify the language, or set the default in the config.
  "gender": "male", // (optional) Specify the gender (see supported voices of endpoint.)
  "volume": 50, // (optional) If you want a different volume for the notification
  "onlyWhenPlaying": false // (optional) make sure that it only plays when you're listening to music. So it won't play when you're sleeping.
}
```

## Run a MQTT server in docker

If your want to test this library it's best to create a mqtt server just for testing. This can easily be done with the followinf docker command:
`docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto`

## Use [PM2](http://pm2.keymetrics.io) to run in background

If everything works as expected, you should make the app run in the background automatically. Personally I use PM2 for this. And they have a great [guide for this](http://pm2.keymetrics.io/docs/usage/quick-start/).

## Node-sonos-ts

This library depends on [node-sonos-ts](https://github.com/svrooij/node-sonos-ts/) which I also developed. All other libraries using node-sonos-ts should also be able to implemented all the nice features included there. Like **notifications**  or **text-to-speech** which are the coolest new additions for **sonos2mqtt**!

## Beer or Coffee

This bridge and the [sonos package](https://github.com/svrooij/node-sonos-ts) took me a lot of hours to build, so I invite everyone using it to at least have a look at my [Sponsor page](https://github.com/sponsors/svrooij). Even though the sponsoring tiers are montly you can also cancel anytime :wink:

## Special thanks

The latest version of this bridge is inspired on [hue2mqtt.js](https://github.com/hobbyquaker/hue2mqtt.js) by [Sabastian Raff](https://github.com/hobbyquaker). That was a great sample on how to create a globally installed, command-line, something2mqtt bridge.

[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red
[badge_issues]: https://img.shields.io/github/issues/svrooij/sonos2mqtt
[badge_docker]: https://img.shields.io/docker/pulls/svrooij/sonos2mqtt
[link_sponsor]: https://github.com/sponsors/svrooij
[link_issues]: https://github.com/svrooij/sonos2mqtt/issues
[link_docker]: https://hub.docker.com/r/svrooij/sonos2mqtt