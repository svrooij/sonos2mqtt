---
layout: default
title: Commands
parent: Control speakers
nav_order: 1
permalink: /control/commands.html
---

# Sending commands to sonos speaker

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

## Supported commands

All these commands are crafted specially to be used in sonos2mqtt.

|Command| |Description|Input|
|-------|-|-----------|-------|
|`joingroup`||Join another group by name|name of other device|
|`leavegroup`||Remove current device from the group it's in| |
|`mute`|:speaker:|Mute the volume| |
|`next`|:fast_forward:|Go to next song in queue| |
|`notify`|:bell:|Play a notification sound and restore playback|see [notifications](notifications.html#play-a-mp3)|
|`pause`||Pause playback| |
|`play`|:arrow_forward:|Start playback| |
|`playmode`|:twisted_rightwards_arrows:|Change the playmode, when using queue|`NORMAL`, `REPEAT_ALL`, `SHUFFLE` or `SHUFFLE_NOREPEAT`.|
|`previous`|:rewind:|Go to previous song in queue| |
|`queue`|:heavy_plus_sign:|Add a song to the queue|Track uri|
|`seek`|:clock330:|Seek in the current track|Time like `0:02:45`|
|`selecttrack`||Select another track in the current queue|number|
|`setavtransporturi`|:abcd:|Set the current playback uri, for advanced cases.|playback or track uri (check out the trackUri topic to find the required value)|
|`sleep`|:zzz:|Set a sleeptimer for x minutes|number|
|`speak`|:speech_balloon:|Generate text-to-speech file and play as notification :tada:|see [text-to-speech](notifications.html#text-to-speech)|
|`stop`|:no_entry_sign:|Stop Playback| |
|`switchtoline`||Switch to line-in (on supported devices)| |
|`switchtoqueue`||Switch to queue| |
|`switchtotv`||Switch to TV input (on supported devices, eg. playbar)| |
|`toggle`||Toggle between pause and play| |
|`unmute`|:mute:|Unmute the volume| |
|`volume`|:speaker:|Set the volume to a value|number (between 1 and 100)|
|`volumedown`|:heavy_minus_sign:|Decrease volume with 5 or number|optional number|
|`volumeup`|:heavy_plus_sign:|Increase volume with 5 or number|optional number|

Check out the [commands](https://github.com/svrooij/sonos2mqtt/blob/master/src/sonos-commands.ts) or the [mapping](https://github.com/svrooij/sonos2mqtt/blob/master/src/sonos-command-mapping.ts) if you're interested in how this works.
