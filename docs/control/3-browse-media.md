---
layout: default
title: Browse
parent: Control speakers
nav_order: 3
permalink: /control/browse.html
---

# Browse
{: .no_toc }

The sonos speaker has an extensive library for local and remote media. Sometimes you'll need to supply metadata if you want to play some not supported source. See [playback](playback.html). Recently we added a feature to allow [returning data](advanced.html#fetch-data) as discussed [here](https://github.com/svrooij/sonos2mqtt/issues/101). That also allows for broswing the library.

1. TOC
{:toc}

---

## Favorites

You can get your favorites with the following command. This is a [command](https://svrooij.github.io/node-sonos-ts/sonos-device/methods.html#content) in the sonos control library which means case sensitive.

Topic: `sonos/uuid_of_speaker/control`
Payload:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "GetFavorites",
    "reply": "GetFavoritesReply"
  }
}
```

With the `reply` property being in beta right now. But it should then return a message at `sonos/uuid/GetFavoritesReply` with the following content:

```json
{
  "Result": [{
    "AlbumArtUri": "https://i.scdn.co/image/f8eb3c2a6921b2a71f5a4a4de7eecc6fc8cf5021",
    "Title": "Bottoms Up",
    "UpnpClass": "object.itemobject.item.sonos-favorite",
    "ItemId": "FV:2/21",
    "ParentId": "FV:2",
    "TrackUri": "x-sonos-spotify:spotify:track:7nDoBWDvf02SyD8kEQuuPO?sid=9&flags=8224&sn=7",
    "ProtocolInfo": "sonos.com-spotify:*:audio/x-spotify:*"
  }, {
    "AlbumArtUri": "http://d1i6vahw24eb07.cloudfront.net/s106914q.gif",
    "Title": "Q-Dance Hard",
    "UpnpClass": "object.itemobject.item.sonos-favorite",
    "ItemId": "FV:2/9",
    "ParentId": "FV:2",
    "TrackUri": "x-sonosapi-stream:s106914?sid=254&flags=32",
    "ProtocolInfo": "x-sonosapi-stream:*:*:*"
  }, {
    "AlbumArtUri": "http://d1i6vahw24eb07.cloudfront.net/s87683q.gif",
    "Title": "Q-Music",
    "UpnpClass": "object.itemobject.item.sonos-favorite",
    "ItemId": "FV:2/2",
    "ParentId": "FV:2",
    "TrackUri": "x-sonosapi-stream:s87683?sid=254&flags=32",
    "ProtocolInfo": "x-sonosapi-stream:*:*:*"
  }, {
    "Title": "SLAM!FM",
    "UpnpClass": "object.itemobject.item.sonos-favorite",
    "ItemId": "FV:2/13",
    "ParentId": "FV:2",
    "TrackUri": "x-sonosapi-stream:s67814?sid=254&flags=32",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }, {
    "AlbumArtUri": "http://spotify-static-resources.s3.amazonaws.com/imgstub/your_music_v4_legacy.png",
    "Title": "Your Library",
    "UpnpClass": "object.itemobject.item.sonos-favorite",
    "ItemId": "FV:2/22",
    "ParentId": "FV:2"
  }],
  "NumberReturned": 5,
  "TotalMatches": 5,
  "UpdateID": 1
}
```

## Favorite radio stations

Topic: `sonos/uuid/control`
Payload:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "GetFavoriteRadioStations",
    "reply": "Reply"
  }
}
```

You will get a response at the `sonos/uuid/Reply` topic with the following content:

```json
{
  "Result": [{
    "Title": "100% NL 94.9 (Nederlands)",
    "UpnpClass": "object.item.audioItem.audioBroadcast",
    "ItemId": "R:0/0/20",
    "ParentId": "R:0/0",
    "TrackUri": "x-sonosapi-stream:s78122?sid=254&flags=8224&sn=0",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }, {
    "Title": "Sky Radio",
    "UpnpClass": "object.item.audioItem.audioBroadcast",
    "ItemId": "R:0/0/4",
    "ParentId": "R:0/0",
    "TrackUri": "x-sonosapi-stream:s9067?sid=254&flags=32",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }, {
    "Title": "Slam hardstyle",
    "UpnpClass": "object.item.audioItem.audioBroadcast",
    "ItemId": "R:0/0/19",
    "ParentId": "R:0/0",
    "TrackUri": "x-rincon-mp3radio://https://20423.live.streamtheworld.com/WEB11_MP3_SC?",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }, {
    "Title": "SLAM!FM",
    "UpnpClass": "object.item.audioItem.audioBroadcast",
    "ItemId": "R:0/0/11",
    "ParentId": "R:0/0",
    "TrackUri": "x-sonosapi-stream:s67814?sid=254&flags=32",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }, {
    "Title": "Slam!Hardstyle",
    "UpnpClass": "object.item.audioItem.audioBroadcast",
    "ItemId": "R:0/0/12",
    "ParentId": "R:0/0",
    "TrackUri": "x-sonosapi-stream:s155542?sid=254&flags=32",
    "ProtocolInfo": "x-rincon-mp3radio:*:*:*"
  }],
  "NumberReturned": 13,
  "TotalMatches": 13,
  "UpdateID": 1
}
```

## Favorite radio shows

Topic: `sonos/uuid/control`
Payload:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "GetFavoriteRadioShows",
    "reply": "Reply"
  }
}
```

Response is the same as above.

## Browse with own query

All the above methods are actually browse commands with the query pre-defined. You can also search with your own query (if you know how the query works).

Topic: `sonos/uuid/control`

Payload for browse with defaults:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "ContentDirectoryService.BrowseParsedWithDefaults",
    "val": "your_query_value_here",
    "reply": "Reply"
  }
}
```

Replace `your_query_value_here` with one of the following:

- `R:0/1` Favorite radio stations.
- `R:0/0` Favorite radio shows.
- `Q:0` for the queue.
- `A:ARTIST:{name}` to search for an artist results are a list of artists
- `A:ARTIST/{name}` the track fron the found artist.

## Browse with total control

The above command still has some sensible defaults, but if you want a smaller set of results use the following command:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "ContentDirectoryService.BrowseParsed",
    "val": {
      "ObjectID": "your_query_value_here",
      "BrowseFlag": "BrowseDirectChildren",
      "Filter": "*",
      "StartingIndex": 0,
      "RequestedCount": 0,
      "SortCriteria": ""
    },
    "reply": "Reply"
  }
}
```

See [here](https://github.com/svrooij/node-sonos-ts/blob/master/src/services/content-directory.service.ts#L178-L200) for the explaination of all the parameters.
