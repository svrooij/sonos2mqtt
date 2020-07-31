---
layout: default
title: Playback
parent: Control speakers
nav_order: 2
permalink: /control/playback.html
---

# Playback
{: .no_toc }

You have a lot of ways to play stuff on your sonos speaker. Sonos devides this into two groups items and containers (eg. playlists). You might need some kind of metadata to play your track.

1. TOC
{:toc}

---

## Playing a single item or stream

### Play a single item

Every supported track or stream can be played as an individual item. You'll need a supported item url and execute the following command.

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "setavtransporturi",
  "input": "spotify:track:0GiWi4EkPduFWHQyhiKpRB"
}
```

|Provider|Name|Format|Sample|
|--------|----|------|------|
||MP3|`http://somesite.com/song.mp3`||
|Spotify|Track|`spotify:track:{id}`|`spotify:track:0GiWi4EkPduFWHQyhiKpRB`|
|Spotify|Artist radio|`spotify:artistRadio:{artistId}`|`spotify:artistRadio:72qVrKXRp9GeFQOesj0Pmv`|
|TuneIn|Radio station|`radio:s{id}`||

### Play a single item for experts

To above sample tries to guess the required metadata based on the track uri. This is supported for the above links, if you want to play something that isn't supported this way, you have 2 options.

1. Try to help us extending the [metadata helper](https://github.com/svrooij/node-sonos-ts/blob/master/src/helpers/metadata-helper.ts).
2. Try to play it by guessing the metadata yourself, or fetching it from some other source.

You probably need set the following metadata properties `UpnpClass` and `CdUdn`, sometimes the `ItemId` is also required. You can start by skipping them if you don't know the required values. This sample command is in fact the same as the above (where the metadata is [guessed automatically](https://github.com/svrooij/node-sonos-ts/blob/46b95b18dd6c96cb93ed8442d4f067afbdb687f4/src/helpers/metadata-helper.ts#L175-L186)).

You can find the metadata by listening for events and changing the track with the regular sonos app. Or (how this was done originally) start WireShark on your laptop to monitor `port 1400` and capture the instruction from the regular sonos app.

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "AVTransportService.SetAVTransportURI",
    "val": {
      "InstanceID": 0,
      "CurrentURI":"x-sonos-spotify:spotify%3atrack%3a0GiWi4EkPduFWHQyhiKpRB?sid=9&amp;flags=8224&amp;sn=7",
      "CurrentURIMetaData": {
        "UpnpClass": "object.item.audioItem.musicTrack",
        "ItemId": "00032020spotify%3atrack%3a0GiWi4EkPduFWHQyhiKpRB",
        "CdUdn": "SA_RINCON2311_X_#Svc2311-0-Token"
      }
    }
  }
}
```

## Queue

There is also a concept of a queue in the sonos speaker. You can use the following command to add a track to the queue.

### Add item to queue

If you want to add a track to the queue, execute the following command.

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "AddUriToQueue",
    "val": "spotify:track:0GiWi4EkPduFWHQyhiKpRB"
  }
}
```

|Provider|Name|Format|Sample|
|--------|----|------|------|
||MP3|`http://somesite.com/song.mp3`||
|Sonos|Local file|||
|Sonos|Playlist|||
|Spotify|Album|`spotify:album:{id}`|`spotify:album:4q2mtBkyPrFynvTRbi5HOv`|
|Spotify|Artist top tracks|`spotify:artistTopTracks:{artistId}`|`spotify:artistTopTracks:72qVrKXRp9GeFQOesj0Pmv`|
|Spotify|Playlist|`spotify:playlist:{id}`|`spotify:playlist:??`|
|Spotify|Track|`spotify:track:{id}`|`spotify:track:0GiWi4EkPduFWHQyhiKpRB`|
|Spotify|User Playlist|`spotify:user:{id}`|`spotify:user:??`|

### Add item to queue for experts

To above sample tries to guess the required metadata based on the track uri. This is supported for the above links, if you want to play something that isn't supported this way, you have 2 options.

1. Try to help us extending the [metadata helper](https://github.com/svrooij/node-sonos-ts/blob/master/src/helpers/metadata-helper.ts).
2. Try to play it by guessing the metadata yourself, or fetching it from some other source.

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "AVTransportService.AddURIToQueue",
    "val": {
      "InstanceID": 0,
      "DesiredFirstTrackNumberEnqueued": 0,
      "EnqueueAsNext": true,
      "EnqueuedURI":"x-sonos-spotify:spotify%3atrack%3a0GiWi4EkPduFWHQyhiKpRB?sid=9&amp;flags=8224&amp;sn=7",
      "EnqueuedURIMetaData": {
        "UpnpClass": "object.item.audioItem.musicTrack",
        "ItemId": "00032020spotify%3atrack%3a0GiWi4EkPduFWHQyhiKpRB",
        "CdUdn": "SA_RINCON2311_X_#Svc2311-0-Token"
      }
    }
  }
}
```

### Switch to queue

If you started a single item, you player probably isn't using the queue anymore, you first have to switch to it before you can start playing something else.

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "switchtoqueue"
}
```

### Clear the queue

In case you want to remove all tracks from the queue you can call this command.

`sonos/uuid_of_player/control`

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "AVTransportService.RemoveAllTracksFromQueue"
  }
}
```

### List queue content (expert)

`sonos/uuid/control`

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "GetQueue",
    "reply": "MyQueueReply"
  }
}
```

Response will be send to `sonos/uuid/MyQueueResult` (last part is the value of the reply in request).

```json
{
  "Result": [{
    "Album": "Carry On",
    "Artist": "Martin Jensen",
    "AlbumArtUri": "http://192.168.x.x:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:3YnOIhATp9QC9OxJb3pDfg%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title": "Carry On",
    "UpnpClass": "object.item.audioItem.musicTrack",
    "Duration": "0:02:32",
    "ItemId": "Q:0/1",
    "ParentId": "Q:0",
    "TrackUri": "x-sonos-spotify:spotify:track:3YnOIhATp9QC9OxJb3pDfg?sid=9&flags=8224&sn=7",
    "ProtocolInfo": "sonos.com-spotify:*:audio/x-spotify:*"
  }, {
    "Album": "By My Side (feat. Anthony Valadez)",
    "Artist": "Ferreck Dawn",
    "AlbumArtUri": "http://192.168.x.x:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:6eSWdCAvzD4danVK3OlqYU%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title": "By My Side (feat. Anthony Valadez)",
    "UpnpClass": "object.item.audioItem.musicTrack",
    "Duration": "0:02:37",
    "ItemId": "Q:0/2",
    "ParentId": "Q:0",
    "TrackUri": "x-sonos-spotify:spotify:track:6eSWdCAvzD4danVK3OlqYU?sid=9&flags=8224&sn=7",
    "ProtocolInfo": "sonos.com-spotify:*:audio/x-spotify:*"
  }, {
    "Album": "Get in Trouble (So What)",
    "Artist": "Dimitri Vegas &amp; Like Mike",
    "AlbumArtUri": "http://192.168.x.x:1400/getaa?s=1&u=x-sonos-spotify:spotify:track:5KC7ginqShi7mhDQLttQh0%3fsid%3d9%26flags%3d8224%26sn%3d7",
    "Title": "Get in Trouble (So What)",
    "UpnpClass": "object.item.audioItem.musicTrack",
    "Duration": "0:02:41",
    "ItemId": "Q:0/61",
    "ParentId": "Q:0",
    "TrackUri": "x-sonos-spotify:spotify:track:5KC7ginqShi7mhDQLttQh0?sid=9&flags=8224&sn=7",
    "ProtocolInfo": "sonos.com-spotify:*:audio/x-spotify:*"
  }],
  "NumberReturned": 61,
  "TotalMatches": 61,
  "UpdateID": 4
}
```

## Special streams

Your player also has some special streams, where you can connect to. These will start a special stream and will thus disconnect from the queue.

### Line in

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "switchtoline"
}
```

### TV input

Topic: `sonos/uuid_of_player/control`

```json
{
  "command": "switchtotv"
}
```
