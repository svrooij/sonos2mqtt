---
layout: default
title: Topics
nav_order: 3
---

# Topics
{: .no_toc }

Every message starts with a prefix (see [configuration](/sonos2mqtt/getting-started.html#configuration)) that defaults to `sonos`. So if you change this all the topics change.

1. TOC
{:toc}

---

## Connect messages

This bridge uses the `sonos/connected` topic to send retained connection messages. Use this topic to check your sonos bridge is still running.

* `0` or missing is not connected (set by will functionality).
* `1` is connected to mqtt, but not to any sonos device.
* `2` is connected to mqtt and at least one sonos speaker. (ultimate success!)

## Player status

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

### Error message

If you tried to execute a command and it failed, you will get a message at `sonos/uuid_of_speaker/error` that looks like:

```json
{
  "command":"executed_command",
  "error": {
    "...": ""
  }
}
```

### AVTransport message

Topic: `sonos/status/name_or_uuid_of_speaker/avtransport`

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

Topic: `sonos/status/name_or_uuid_of_speaker/renderingcontrol`

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

This application also supports sending several splitted messages. You will need to enable them by setting `--distinct`. Once enabled this app will also emit the following messages. These messages all start with `sonos/status/name_or_uuid_of_speaker/` followed by one of these suffixes.

|suffix|Description|Sample output|
|-----|-----------|-------------|
|`group`|Name of the group this player is in|`Kitchen + 2`|
|`coordinator`|UUID of the group coordinator|`RINCON_000E5000000001400`|
|`track`|Json with info about current track| *Just check yourself*|
|`trackuri`|URI of the current song|`x-sonosprog-spotify:spotify%3atrack%3a3JvKfv6T31zO0ini8iNItO?sid=9&amp;flags=8224&amp;sn=7`|
|`muted`|boolean for muted status|`true` / `false`|
|`state`|Current playback state|`PLAYING` / `PAUSED` / `STOPPED`|
|`volume`|Current volume of player|number between 0 and 100|

## Homeassistant auto-discovery

Currently homeassistant [doesn't support](https://www.home-assistant.io/docs/mqtt/discovery/) auto-discovery for media speakers. This library does however emit auto-discovery messages for each speaker (once enabled), see it as a new proposed device type supported by auto-discovery over mqtt. Enable the auto-discovery messages by setting `discovery` to true (and change the prefix by setting `discoveryprefix`).

Topic: `homeassistant/music_player/RINCON_000E5000000001400/sonos/config`

```json
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

The command topic accepts all the commands listed in the available_commands property. All the commands should be send like described [here](control/commands.html). The json_attribute_topic displays the topic where all the different speakers properties are present. Maybe there should be some standard (contact me, developers from home assistant).

To discover every speaker we emit, just subscribe to `homeassistant/music_player/+/sonos/config` all the discovery messages are retained, so you will also receive the messages if your app starts after sonos2mqtt.
