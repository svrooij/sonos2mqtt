---
layout: default
title: Send notifications
parent: Control speakers
nav_order: 5
permalink: /control/notifications.html
---

# Notifications

Notification are automatically managed by the application. It will return playback once the notification has played. Either [play a mp3](#play-a-mp3) or a [spoken message](#text-to-speech).

---

## Play a mp3

To play a short music file as a notification send the following payload to command topic.

Topic: `sonos/uuid_of_speaker/control`

Payload:

```json
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

### Play notification on all speakers

You can also have a notification play on all groups (all devices that coordinate themself), just send the following message to `sonos/cmd/notify`.

```json
{
  "trackUri": "https://cdn.smartersoft-group.com/various/pull-bell-short.mp3",
  "onlyWhenPlaying": false,
  "timeout": 10,
  "volume": 8,
  "delayMs": 700
}
```

### Notification explained

Internally the notifications work as following.

1. Get the current state
2. Check if it is currently playing, and cancel if not playing and you specified `onlyWhenPlaying: true`.
3. Play the sound
4. Wait for playback to stop (or the timeout to expire)
5. Restore all previously fetched status (Track, queue, volume,...)

More information about [notifications](https://svrooij.github.io/node-sonos-ts/sonos-device/notifications-and-tts.html)

## Text to speech

<iframe src="https://github.com/sponsors/svrooij/button" title="Sponsor svrooij" height="35" width="107" style="border: 0;"></iframe>

You can have your sonos speaker prononce some notification text, which is a pretty cool feature. But you'll need some extra work. You'll need a text-to-speech endpoint as described [here](https://svrooij.github.io/node-sonos-ts/sonos-device/notifications-and-tts.html#text-to-speech). You have two options either host your own [server][link_polly_tts] or become a [sponsor][link_sponsor] and get access to my personal hosted TTS server.

Either way you will have a TTS endpoint at hand. You can set it in the configuration or supply it with every request.

|Option|Value|Environment variable|Config|
|------|-----|--------------------|------|
|Default language|`en-US`|`SONOS_TTS_LANG`|`--ttslang`|
|Default endpoint|`http://some-server.domain.com/api/generate`|`SONOS_TTS_ENDPOINT`|`--ttsendpoint`|

Have a speaker speak by sending the following to `sonos/uuid_of_speaker/control`. Endpoint is optional (if set in environment), lang is options if set in config, `gender`, `name`, `volume` & `onlyWhenPlaying` are always optional.

```json
{
  "command":"speak",
  "input": {
    "text": "Someone at the front-door",
    "endpoint": "https://your.tts.endpoint/api/generate",
    "lang": "en-US",
    "gender": "male",
    "name": "Salli",
    "volume": 50,
    "onlyWhenPlaying": false,
    "delayMs": 700
  }
}
```

### Text to speech on all speakers

Send this payload to `sonos/cmd/speak` to play it on all groups. Same parameters as above.

```json
{
  "text": "Someone at the front-door",
  "endpoint": "https://your.tts.endpoint/api/generate",
  "lang": "en-US",
  "gender": "male",
  "name": "Salli",
  "volume": 50,
  "onlyWhenPlaying": false,
  "delayMs": 700
}
```

### Text to speech explained

The text-to-speech method executes the following:

1. Ask the TTS endpoint what the url of the supplied text is.
2. If the server doesn't have this file, it will generate the mp3 file on the fly.
3. The TTS endpoint returns the url of the mp3.
4. We call the `.PlayNotification({})` command above, with the tts url.

This way you don't have to worry about encoding the text so sonos understands it. Sonos will just get a regular url to the mp3 file with the spoken text.

The [server][link_polly_tts] I've build is based on Amazon Polly, but I invite eveybody to build their own if you want to support an other tts service. You can replace it with any other TTS service as long as it expects a post request with the data below and responds with a json message with either `uri` or `cdnUri`. The sonos speaker needs the `.mp3` at the end to be able to play the file smoothly.

### TTS API

Request `POST` to `https://your-tts-api.com/api/generate`

```json
{
  "text": "Hello from polly",
  "lang": "en-US",
  "gender": "male"
}
```

Response

```json
{
  "cdnUri": "https://cacheUri/en-US/4b6eddb411d4cec3933528bfca05341828ca7593.mp3",
  "uri": "http://your_ip:5601/cache/en-US/4b6eddb411d4cec3933528bfca05341828ca7593.mp3"
}
```

[badge_sponsor]: https://img.shields.io/badge/Sponsor-on%20Github-red
[link_sponsor]: https://github.com/sponsors/svrooij
[link_polly_tts]: https://github.com/svrooij/node-sonos-tts-polly
