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

**sonos2mqtt** is available in the [docker hub](https://hub.docker.com/r/svrooij/sonos2mqtt), since 19-01-2020 we produce a single multi-architecture image for you to use, `amd64`, `arm64`, `armv7` and `i386` are supported. This means you can run sonos2mqtt in docker on almost any device.

Every setting of this library can be set with environment variables prefixed with `SONOS2MQTT_`.

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

This app makes heavy use of events, so you'll have to make sure they still work. That is why you need to expose the listening port (`6329`), changing the port will cause problems. The library will automaticcally subscribe to events from the sonos device, but because you're running in docker it cannot figure out the IP by itself. You set the IP of the docker host in the `SONOS_LISTENER_HOST` environment variable. This is how the events flow.

```plain
================              ===============              ==============
| Sonos Device |  == HTTP =>  | Docker host |  == HTTP =>  | sonos2mqtt |
================              ===============              ==============
```

### Docker-compose

```yaml
version: "3.7"
services:
  sonos:
    image: svrooij/sonos2mqtt
    restart: unless-stopped
    ports:
      - "6329:6329"
    environment:
      - SONOS2MQTT_DEVICE=192.168.50.4 # Service discovery doesn't work very well inside docker, so start with one device.
      - SONOS2MQTT_MQTT=mqtt://emqx:1883 # EMQX is a nice mqtt broker
      - SONOS_LISTENER_HOST=192.168.50.44 # Docker host IP
      - SONOS_TTS_ENDPOINT=http://sonos-tts:5601/api/generate # If you deployed the TTS with the same docker-compose
    depends_on:
      - emqx

# You can skip the TTS server if you want. See https://github.com/svrooij/node-sonos-ts#text-to-speech
# Set the amazon keys to your own
# Set the SONOS_TTS_CACHE_URI to http://[ip_of_docker_host]:5601/cache
  sonos-tts:
    image: svrooij/sonos-tts-polly
    ports:
      - "5601:5601"
    environment:
      - SONOS_TTS_AMAZON_KEY=your_key_id_here
      - SONOS_TTS_AMAZON_SECRET=your_secret_access_token_here
      - SONOS_TTS_AMAZON_REGION=eu-west-1
      - SONOS_TTS_CACHE_URI=http://192.168.30.20:5601/cache

# Optional MQTT server (I like emqx over mosquitto)
  emqx:
    image: emqx/emqx
    restart: unless-stopped
    ports:
      - "1883:1883"
      - "18083:18083"
```

## Local installation

Using sonos2mqtt is really easy, but it requires at least [Node.js](https://nodejs.org/) v8 or higher, because of it's async usage. (This app is tested against v10 and v12).

`sudo npm install -g sonos2mqtt`

## Usage

```bash
sonos2mqtt 0.0.0-development
A smarthome bridge between your sonos system and a mqtt server.

Usage: index.js [options]

Options:
  --prefix           instance name. used as mqtt client id and as prefix for
                     connected topic                          [default: "sonos"]
  --mqtt             mqtt broker url. See
                     https://github.com/svrooij/sonos2mqtt#mqtt-url
                                                   [default: "mqtt://127.0.0.1"]
  --log              Set the loglevel
           [choices: "warning", "information", "debug"] [default: "information"]
  -d, --distinct     Publish distinct track states    [boolean] [default: false]
  -h, --help         Show help                                         [boolean]
  --ttslang          Default TTS language                     [default: "en-US"]
  --ttsendpoint      Default endpoint for text-to-speech
  --device           Start with one known IP instead of device discovery.
  --discovery        Emit retained auto-discovery messages for each player.
                                                                       [boolean]
  --discoveryprefix  The prefix for the discovery messages
                                                      [default: "homeassistant"]
  --version          Show version number                               [boolean]
```

### MQTT Url

Use the MQTT url to connect to your specific mqtt server. Check out [mqtt.connect](https://github.com/mqttjs/MQTT.js#connect) for the full description.

|Situation|Sample|
|---------|------|
|Default|`mqtt://127.0.0.1`|
|Other host (192.168.0.3) and port (1800)| `mqtt://192.168.0.3:1800`|
|Username and password|`mqtt://myuser:the_secret_password@192.168.0.3:1800`|

## Topics

Every message starts with a prefix (see [usage](#usage)) that defaults to `sonos`. So if you change this all the topics change.

### Connect messages

This bridge uses the `sonos/connected` topic to send retained connection messages. Use this topic to check your sonos bridge is still running.

* `0` or missing is not connected (set by will functionality).
* `1` is connected to mqtt, but not to any sonos device.
* `2` is connected to mqtt and at least one sonos speaker. (ultimate success!)

### Status messages

The status of each speaker will be published to `sonos/status/speaker_name/subtopic` as a JSON object containing the following fields. This sample uses `sonos` as prefix and the device `Kitchen`. Each event will contain json in the following form.

* `val` The value for this subtopic
* `name` The name of the speaker
* `ts` Timestamp of this message

The sample value is what is in the `val` property of the json in the body.

|Topic|Description|Retained|Sample value|
|-----|-----------|--------|------------|
|`sonos/status/kitchen/coordinator`|When the coordinator (group leader managing the music) of the group changes|Yes|`RINCON_00000000000001400`|
|`sonos/status/kitchen/group`|Groupname|Yes|`Kitchen` (for a single group) or `Kitchen + 3` (if multiple devices are in the group)|
|`sonos/status/kitchen/muted`|Is the volume muted|Yes|`false` or `true`|
|`sonos/status/kitchen/state`|Changes in playback state|Yes|`PLAYING` or `STOPPED`|
|`sonos/status/kitchen/track`|Current track metadata|No|See below|
|`sonos/status/kitchen/trackUri`|Current track uri|No|`x-sonos-spotify:spotify%3atrack%3a30cW9fD87IgbYFl8o0lUze?sid=9&amp;flags=8224&amp;sn=7`|
|`sonos/status/kitchen/volume`|The current volume|Yes|`30` (0 to 100)|

Track topic data sample

```JSON with Comments
{
  "ts" : 1577456567766,
  "name" : "Keuken",
  "val" : {
    "title" : "Home (feat. Bonn)",
    "artist" : "Martin Garrix",
    "album" : "Home (feat. Bonn)",
    "albumArt" : "http://192.168.0.53:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:4aTtHoSBB0CuQGA6vXBNyp%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "trackUri" : "x-sonos-spotify:spotify:track:4aTtHoSBB0CuQGA6vXBNyp?sid=9&flags=8224&sn=7"
  }
}
```

By default you can subscribe to the following subtopics `coordinator` (retained), `state` (retained), `volume` (retained), `muted` (retaind) and `track`/`trackUri` (not retained) but if you wish to have separate topics for the track values you can specify the `-d` or `--publish-distinct` parameter and you will get the `artist`, `title`, `album`, `trackUri` and `albumart` topics.

### Controlling sonos

You can control sonos by sending an empty message on these topics. The topic format is like `sonos/set/room_name/command` for instance `sonos/set/Office/next`.

|Command| |Description|Payload|
|-------|-|-----------|-------|
|`next`|:fast_forward:|Go to next song in queue| |
|`previous`|:rewind:|Go to previous song in queue| |
|`pause`||Pause playback| |
|`play`|:arrow_forward:|Start playback| |
|`toggle`||Toggle between pause and play| |
|`stop`|:no_entry_sign:|Stop Playback| |
|`selecttrack`||Select another track in the current queue|number|
|`seek`|:clock330:|Seek in the current track|Time like `0:02:45`|
|`queue`|:heavy_plus_sign:|Add a song to the queue|Track uri|
|`playmode`|:twisted_rightwards_arrows:|Change the playmode, when using queue|`NORMAL`, `REPEAT_ALL`, `SHUFFLE` or `SHUFFLE_NOREPEAT`.|
|`setavtransporturi`|:abcd:|Set the current playback uri, for advanced cases.|playback or track uri (check out the trackUri topic to find the required value)|
|`volume`|:speaker:|Set the volume to a value|number (between 1 and 100)|
|`volumeup`|:heavy_plus_sign:|Increase volume with 5 or number|optional number|
|`volumedown`|:heavy_minus_sign:|Decrease volume with 5 or number|optional number|
|`mute`|:speaker:|Mute the volume| |
|`unmute`|:mute:|Unmute the volume| |
|`sleep`|:zzz:|Set a sleeptimer for x minutes|number|
|`joingroup`||Join another group by name|name of other device|
|`leavegroup`||Remove current device from the group it's in| |
|`notify`|:bell:|Play a notification sound and restore playback|see [notifications](#notifications)|
|`speak`|:speech_balloon:|Generate text-to-speech file and play as notification :tada:|see [text-to-speech](#text-to-speech)|
|`command`|:cop:|Execute one of the commands above|See [command](#command)|
|`adv-command`|:guardsman:|Execute a command in [node-sonos-ts](https://github.com/svrooij/node-sonos-ts#commands)|See [all commands](https://github.com/svrooij/node-sonos-ts#commands)|

#### Notifications

To play a short music file as a notification send the following payload to `sonos/set/device_name/notify` or to `sonos/cmd/notify` to play it on all devices.

```JSON
{
  "trackUri": "https://cdn.smartersoft-group.com/various/pull-bell-short.mp3",
  "onlyWhenPlaying": false,
  "timeout": 10,
  "volume": 8
}
```

#### Text-to-speech

You can have your sonos speaker prononce some notification text, which is a pretty cool feature. But you'll need some extra work. You'll need a text-to-speech endpoint as described [here](https://github.com/svrooij/node-sonos-ts#text-to-speech). You have two options either host your own [server](https://github.com/svrooij/node-sonos-tts-polly) or become a [sponsor][link_sponsor] and get access to my personal hosted TTS server.

Either way you'll have yourself a text-to-speech endpoint. This can be set in the environment as `SONOS_TTS_ENDPOINT` or you'll have to supply it with every request.

Have a speaker speak by sending the following to `sonos/set/device_name/speak`. Endpoint is optional (if set in environment), lang is options if set in config, gender, volume & onlyWhenPlaying are always optional.

```JSON
{
  "text": "Someone at the front-door",
  "endpoint": "https://your.tts.endpoint/api/generate",
  "lang": "en-US",
  "gender": "male",
  "volume": 50,
  "onlyWhenPlaying": false
}
```

#### Command

Someone [suggested](https://github.com/svrooij/sonos2mqtt/issues/21) to create one endpoint to send all commands to. So you can also send one of the commands above to the `sonos/set/kitchen/command` topic with the following json payload. cmd is always required to be one of the commands, val is optional.

```JSON
{
  "cmd":"volume",
  "val":10
}
```

### Generic commands

There are also some generic commands not tied to a specific speaker. These generic commands should be send to `sonos/cmd/command` like `sonos/cmd/pauseall`.

Generic commands:

|Global command|Description|Payload|
|--------------|-----------|-------|
|`pauseall`|Pause all your speakers| |
|`listalarms`|Load and send all your alarms to `sonos/alarms`| |
|`setalarm`|Enable(/disable) an existing alarm.|JSON `{"id":30,"enabled":true}`|
|`notify`|Play a notification on all speakers.|JSON see [notifications](#notifications)|

## Run a MQTT server in docker

If your want to test this library it's best to create a mqtt server just for testing. This can easily be done with the following docker command:
`docker run -it -p 1883:1883 -p 9001:9001 eclipse-mosquitto`

## Use [PM2](http://pm2.keymetrics.io) to run in background

The preferred method of running Sonos2Mqtt is in Docker, but you can always run in on the device itself. PM2 is a nice tool to run and log scripts in the background.And they have a great [guide for this](http://pm2.keymetrics.io/docs/usage/quick-start/).

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