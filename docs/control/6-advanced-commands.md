---
layout: default
title: Advanced commands
parent: Control speakers
nav_order: 6
permalink: /control/advanced.html
---

# Advanced commands

The used [sonos library](https://github.com/svrooij/node-sonos-ts) has way more to offer. So we also provide a way to execute all the [other commands](https://svrooij.github.io/node-sonos-ts/sonos-device).

Send a message to the control endpoint `sonos/uuid_of_speaker/control` with the following payload to execute the [SetVolume command](https://svrooij.github.io/node-sonos-ts/sonos-device/services/renderingcontrolservice.html#setvolume):

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
  }
}
```

- **command**: Should be `adv-command`.
- **input**: Object containing extra information.
  - **cmd**: The sonos library command, prefixed with the service name.
  - **val**: Object containing the required parameters (names are case sensitive!)

## Fetch data

Where are also trying to implemened a way to fetch data from the speakers, this is currently discussed [here](https://github.com/svrooij/sonos2mqtt/issues/101) (feedback wanted!). The current (beta) solution looks like:

Send a command that you expect to return data and specify the `reply` option.

Topic: `sonos/uuid_of_speaker/control`
Payload:

```json
{
  "command": "adv-command",
  "input": {
    "cmd": "RenderingControlService.GetVolume",
    "val": {
      "InstanceID": 0,
      "Channel": "Master"
    },
    "reply": "GetVolumeResponse"
  }
}
```

You will then get a message at `sonos/uuid_of_speaker/{reply}` like `sonos/uuid_of_speaker/GetVolumeResponse`.

```json
{ "CurrentVolume": 40 }
```
