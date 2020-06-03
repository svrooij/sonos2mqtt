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
# Publish distinct if your want
# SONOS2MQTT_DISTINCT=true
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
      # - SONOS2MQTT_DISTINCT=true # if your want distinct topics
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
  --prefix           instance name. used as prefix for all topics
                                                              [default: "sonos"]
  --mqtt             mqtt broker url. See
                     https://github.com/svrooij/sonos2mqtt#mqtt-url
                                                   [default: "mqtt://127.0.0.1"]
  --clientid         Specify the client id to be used
  --log              Set the loglevel
           [choices: "warning", "information", "debug"] [default: "information"]
  --distinct         Publish distinct track states    [boolean] [default: false]
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

### Configuration

The configuration is loaded from any of these sources. Config file from location `/data/config.json` (overridable with ENV `CONFIG_PATH`). Environment variables config name prefixed with `SONOS2MQTT_` or commandline parameters. Choose whatever suits your needs.

### MQTT Url

Use the MQTT url to connect to your specific mqtt server. Check out [mqtt.connect](https://github.com/mqttjs/MQTT.js#connect) for the full description.

|Situation|Sample|
|---------|------|
|Default|`mqtt://127.0.0.1`|
|Other host (192.168.0.3) and port (1800)| `mqtt://192.168.0.3:1800`|
|Username and password|`mqtt://myuser:the_secret_password@192.168.0.3:1800`|

## Controlling Sonos

You can control all your speakers by sending a message to `sonos/uuid_of_speaker/control` with the following payload:

```json
{
  "command": "name_of_command",
  "input": "optional input for this command"
}
```

like (to set the volume to 10):

```json
{
  "command": "volume",
  "input": 10
}
```

### Supported command

|Command| |Description|Payload|
|-------|-|-----------|-------|
|`joingroup`||Join another group by name|name of other device|
|`leavegroup`||Remove current device from the group it's in| |
|`mute`|:speaker:|Mute the volume| |
|`next`|:fast_forward:|Go to next song in queue| |
|`notify`|:bell:|Play a notification sound and restore playback|see [notifications](#notifications)|
|`pause`||Pause playback| |
|`play`|:arrow_forward:|Start playback| |
|`playmode`|:twisted_rightwards_arrows:|Change the playmode, when using queue|`NORMAL`, `REPEAT_ALL`, `SHUFFLE` or `SHUFFLE_NOREPEAT`.|
|`previous`|:rewind:|Go to previous song in queue| |
|`queue`|:heavy_plus_sign:|Add a song to the queue|Track uri|
|`seek`|:clock330:|Seek in the current track|Time like `0:02:45`|
|`selecttrack`||Select another track in the current queue|number|
|`setavtransporturi`|:abcd:|Set the current playback uri, for advanced cases.|playback or track uri (check out the trackUri topic to find the required value)|
|`sleep`|:zzz:|Set a sleeptimer for x minutes|number|
|`speak`|:speech_balloon:|Generate text-to-speech file and play as notification :tada:|see [text-to-speech](#text-to-speech)|
|`stop`|:no_entry_sign:|Stop Playback| |
|`switchtoline`||Switch to line-in (on supported devices)| |
|`switchtoqueue`||Switch to queue| |
|`switchtotv`||Switch to TV input (on supported devices, eg. playbar)| |
|`toggle`||Toggle between pause and play| |
|`unmute`|:mute:|Unmute the volume| |
|`volume`|:speaker:|Set the volume to a value|number (between 1 and 100)|
|`volumedown`|:heavy_minus_sign:|Decrease volume with 5 or number|optional number|
|`volumeup`|:heavy_plus_sign:|Increase volume with 5 or number|optional number|

#### Advanced commands

The used sonos library has a lot to other [available commands](https://svrooij.github.io/node-sonos-ts/sonos-device) but we cannot implement all of them. Instead we made a way for you to execute all available commands on the sonos device. You'll need to send message to `sonos/uuid_of_speaker/control` with the following payload.

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "RenderingControlService.SetVolume",
    "val": {
      "InstanceID": 0,
      "Channel": "Master",
      "DesiredVolume": 20
    }
  },

}
```

## Notifications

To play a short music file as a notification send the following payload to `sonos/uuid_of_speaker/control`. More information about [notifications](https://svrooij.github.io/node-sonos-ts/sonos-device/notifications-and-tts.html)

```JSON
{
  "command": "notify",
  "input": {
    "trackUri": "https://cdn.smartersoft-group.com/various/pull-bell-short.mp3",
    "onlyWhenPlaying": false,
    "timeout": 10,
    "volume": 8,
    "delayMs": 700
  }
}
```

You can also have a notification play on all speakers, just send the following message to `sonos/cmd/notify`.

```JSON
{
  "trackUri": "https://cdn.smartersoft-group.com/various/pull-bell-short.mp3",
  "onlyWhenPlaying": false,
  "timeout": 10,
  "volume": 8,
  "delayMs": 700
}
```

## Text-to-speech

You can have your sonos speaker prononce some notification text, which is a pretty cool feature. But you'll need some extra work. You'll need a text-to-speech endpoint as described [here](https://svrooij.github.io/node-sonos-ts/sonos-device/notifications-and-tts.html#text-to-speech). You have two options either host your own [server](https://github.com/svrooij/node-sonos-tts-polly) or become a [sponsor][link_sponsor] and get access to my personal hosted TTS server.

Either way you'll have yourself a text-to-speech endpoint. This can be set in the environment as `SONOS_TTS_ENDPOINT` or you'll have to supply it with every request.

Have a speaker speak by sending the following to `sonos/set/device_name/speak`. Endpoint is optional (if set in environment), lang is options if set in config, gender, volume & onlyWhenPlaying are always optional.

```JSON
{
  "text": "Someone at the front-door",
  "endpoint": "https://your.tts.endpoint/api/generate",
  "lang": "en-US",
  "gender": "male",
  "volume": 50,
  "onlyWhenPlaying": false,
  "delayMs": 700
}
```

This message executes the [SetVolume](https://svrooij.github.io/node-sonos-ts/sonos-device/services/renderingcontrolservice.html#setvolume) command of the speaker.

## Topics

Every message starts with a prefix (see [usage](#usage)) that defaults to `sonos`. So if you change this all the topics change.

### Connect messages

This bridge uses the `sonos/connected` topic to send retained connection messages. Use this topic to check your sonos bridge is still running.

* `0` or missing is not connected (set by will functionality).
* `1` is connected to mqtt, but not to any sonos device.
* `2` is connected to mqtt and at least one sonos speaker. (ultimate success!)

### Status message

We emit a single status message for each sonos speaker, on the `sonos/uuid_of_speaker` topic. This status message is a combination of all the sonos events we are listening for. Just create an issue (or PR) if you think there should be more data send to mqtt.

Topic: `sonos/RINCON_000E5000000001400` this message is **retained**.

```json
{
  "uuid" : "RINCON_000E5000000001400",
  "name" : "Kantoor",
  "groupName" : "Kantoor",
  "coordinatorUuid" : "RINCON_000E5000000001400",
  "currentTrack" : {
    "Album" : "Hard Bass 2012 Mixed by The Pitcher, Luna, Frontliner and Chris One",
    "Artist" : "Pavo",
    "AlbumArtUri" : "http://192.168.1.105:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:3Je8RHcdTJ8NGG3krmCHUd%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title" : "Let’s Go! - Radio Edit",
    "UpnpClass" : "object.item.audioItem.musicTrack",
    "Duration" : "0:04:06",
    "ItemId" : "-1",
    "ParentId" : "-1",
    "TrackUri" : "x-sonos-spotify:spotify:track:3Je8RHcdTJ8NGG3krmCHUd?sid=9&flags=8224&sn=7",
    "ProtocolInfo" : "sonos.com-spotify:*:audio/x-spotify:*"
  },
  "enqueuedMetadata" : {
    "Artist" : "stephanvanrooij",
    "AlbumArtUri" : "https://mosaic.scdn.co/640/ab67616d0000b27323f45715a7ccccab470d29b2ab67616d0000b273819f90c805b6a4a816495df9ab67616d0000b273be8e9b832634616dcf14ca97ab67616d0000b273d2cb2c655c141aa8e7fff4f0",
    "Title" : "Hardstyle",
    "UpnpClass" : "object.container.playlistContainer",
    "ItemId" : "10062a6cspotify%3aplaylist%3a5e2KheF9qKRvqCwtFlKEme",
    "ParentId" : "00080024playlists"
  },
  "nextTrack" : {
    "Album" : "Renegades",
    "Artist" : "Frequencerz",
    "AlbumArtUri" : "http://192.168.1.105:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:7iGbCV07PTIWpEBXUoIZG3%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title" : "Renegades",
    "UpnpClass" : "object.item.audioItem.musicTrack",
    "Duration" : "0:04:52",
    "ItemId" : "-1",
    "ParentId" : "-1",
    "TrackUri" : "x-sonos-spotify:spotify:track:7iGbCV07PTIWpEBXUoIZG3?sid=9&flags=8224&sn=7",
    "ProtocolInfo" : "sonos.com-spotify:*:audio/x-spotify:*"
  },
  "transportState" : "PLAYING",
  "playmode" : "SHUFFLE",
  "ts" : 1586344373119,
  "volume" : {
    "Master" : 7,
    "LF" : 100,
    "RF" : 100
  },
  "mute" : {
    "Master" : false,
    "LF" : false,
    "RF" : false
  }
}
```

### AVTransport message

Topic: `sonos/status/name_of_speaker/avtransport`

```json
{
  "CurrentCrossfadeMode" : false,
  "CurrentPlayMode" : "NORMAL",
  "CurrentSection" : 0,
  "CurrentTrack" : 5,
  "CurrentTrackDuration" : "0:04:04",
  "CurrentTrackMetaData" : {
    "Album" : "Long Way Down (Deluxe)",
    "Artist" : "Tom Odell",
    "AlbumArtUri" : "http://192.168.1.105:1400/getaa?s=1&u=x-sonosprog-spotify:spotify:track:3JvKfv6T31zO0ini8iNItO%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title" : "Another Love",
    "UpnpClass" : "object.item.audioItem.musicTrack",
    "Duration" : "0:04:04",
    "ItemId" : "-1",
    "ParentId" : "-1",
    "TrackUri" : "x-sonosprog-spotify:spotify:track:3JvKfv6T31zO0ini8iNItO?sid=9&flags=8224&sn=7",
    "ProtocolInfo" : "sonos.com-spotify:*:audio/x-spotify:*"
  },
  "CurrentTrackURI" : "x-sonosprog-spotify:spotify%3atrack%3a3JvKfv6T31zO0ini8iNItO?sid=9&amp;flags=8224&amp;sn=7",
  "EnqueuedTransportURI" : "x-sonosapi-radio:spotify%3aartistRadio%3a0gadJ2b9A4SKsB1RFkBb66?sid=9&amp;flags=8300&amp;sn=7",
  "EnqueuedTransportURIMetaData" : {
    "Artist" : "Passenger",
    "AlbumArtUri" : "https://i.scdn.co/image/4cc8542ea52b2f0cc4f62d68728a6439068c28b4",
    "Title" : "Passenger Radio",
    "UpnpClass" : "object.item.audioItem.audioBroadcast.#artistRadio",
    "ItemId" : "100c206cspotify%3aartistRadio%3a0gadJ2b9A4SKsB1RFkBb66",
    "ParentId" : "00050024spotify%3aartist%3a0gadJ2b9A4SKsB1RFkBb66"
  },
  "NumberOfTracks" : 37,
  "TransportState" : "PLAYING"
}
```

### Rendering control message

Topic: `sonos/status/name_of_speaker/renderingcontrol`

```json
{
  "Bass" : -2,
  "HeadphoneConnected" : false,
  "Loudness" : true,
  "Mute" : {
    "Master" : false,
    "LF" : false,
    "RF" : false
  },
  "OutputFixed" : false,
  "PresetNameList" : "FactoryDefaults",
  "SpeakerSize" : 5,
  "SubCrossover" : "0",
  "SubEnabled" : true,
  "SubGain" : "0",
  "SubPolarity" : "0",
  "Treble" : 0,
  "Volume" : {
    "Master" : 3,
    "LF" : 100,
    "RF" : 100
  }
}
```

### Distinct messages

This application also supports sending several splitted messages. You will need to enable them by setting `--distinct`. Once enabled this app will also emit the following messages. These messages all start with `sonos/status/name_of_speaker/` followed by one of these suffixes.

|suffix|Description|Sample output|
|-----|-----------|-------------|
|`group`|Name of the group this player is in|`Kitchen + 2`|
|`coordinator`|UUID of the group coordinator|`RINCON_000E5000000001400`|
|`track`|Json with info about current track| *Just check yourself*|
|`trackuri`|URI of the current song|`x-sonosprog-spotify:spotify%3atrack%3a3JvKfv6T31zO0ini8iNItO?sid=9&amp;flags=8224&amp;sn=7`|
|`muted`|boolean for muted status|`true` / `false`|
|`state`|Current playback state|`PLAYING` / `PAUSED` / `STOPPED`|
|`volume`|Current volume of player|number between 0 and 100|

### Generic commands

There are also some generic commands not tied to a specific speaker. These generic commands should be send to `sonos/cmd/command` like `sonos/cmd/pauseall`.

Generic commands:

|Global command|Description|Payload|
|--------------|-----------|-------|
|`pauseall`|Pause all your speakers| |
|`listalarms`|Load and send all your alarms to `sonos/alarms`| |
|`setalarm`|Enable(/disable) an existing alarm.|JSON `{"id":30,"enabled":true}`|
|`notify`|Play a notification on all speakers.|JSON see [notifications](#notifications)|

## Homeassistant auto-discovery

Currently homeassistant [doesn't support](https://www.home-assistant.io/docs/mqtt/discovery/) auto-discovery for media speakers. This library does however emit auto-discovery messages for each speaker, see it as a new proposed device type supported by auto-discovery over mqtt. Enable the auto-discovery messages by setting `discovery` to true (and change the prefix by setting `discoveryprefix`).

Topic: `homeassistant/music_player/RINCON_000E5000000001400/sonos/config`

```JSON
{
  "available_commands" : [ "adv-command", "command", "joingroup", "leavegroup", "mute", "next", "notify", "pause", "play", "playmode", "previous", "queue", "seek", "selecttrack", "setavtransporturi", "sleep", "speak", "stop", "toggle", "unmute", "volume", "volumedown", "volumeup" ],
  "command_topic" : "sonos/RINCON_000E5000000001400/control",
  "device" : {
    "identifiers" : [ "RINCON_000E5000000001400" ],
    "manufacturer" : "Sonos",
    "name" : "TV"
  },
  "device_class" : "speaker",
  "icon" : "mdi:speaker",
  "json_attributes" : true,
  "json_attributes_topic" : "sonos/RINCON_000E5000000001400",
  "name" : "TV",
  "state_topic" : "sonos/RINCON_000E5000000001400",
  "unique_id" : "sonos2mqtt_RINCON_000E5000000001400_speaker",
  "availability_topic" : "sonos/connected",
  "payload_available" : "2"
}
```

The command topic accepts all the commands listed in the available_commands property. All the commands should be send like described [here](#controlling-sonos). The json_attribute_topic displays the topic where all the different speakers properties are present. Maybe there should be some standard (contact me, developers from home assistant).

To discover every speaker we emit, just subscribe to `homeassistant/music_player/+/sonos/config` all the discovery messages are retained, so you will also receive the messages if your app starts after sonos2mqtt.

## Node-sonos-ts

This library depends on [node-sonos-ts](https://github.com/svrooij/node-sonos-ts/) which I also developed. All other libraries using node-sonos-ts should also be able to implemented all the nice features included there. Like **notifications**  or **text-to-speech** which are the coolest new additions for **sonos2mqtt**!

## Beer or Coffee

I'm a big fan of beer and coffee. To provide something extra to everybody who is sponsoring me, I'll provide a hosted TTS server for all my sponsors.

This bridge and the [sonos package](https://github.com/svrooij/node-sonos-ts) took me a lot of hours to build, so I invite everyone using it to at least have a look at my [Sponsor page](https://github.com/sponsors/svrooij). Even though the sponsoring tiers are montly you can also cancel anytime :wink:

## Special thanks

The latest version of this bridge is inspired on [hue2mqtt.js](https://github.com/hobbyquaker/hue2mqtt.js) by [Sabastian Raff](https://github.com/hobbyquaker). That was a great sample on how to create a globally installed, command-line, something2mqtt bridge.

[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red
[badge_issues]: https://img.shields.io/github/issues/svrooij/sonos2mqtt
[badge_docker]: https://img.shields.io/docker/pulls/svrooij/sonos2mqtt
[link_sponsor]: https://github.com/sponsors/svrooij
[link_issues]: https://github.com/svrooij/sonos2mqtt/issues
[link_docker]: https://hub.docker.com/r/svrooij/sonos2mqtt