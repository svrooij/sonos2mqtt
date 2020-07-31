---
layout: default
title: FHEM
parent: Integrations
permalink: /integrations/fhem.html
---

# Using sonos2mqtt with FHEM

Some users of FHEM created a nice integration between FHEM and sonos2mqtt.

## Installation

To use sonos2mqtt with fhem, you'll need to run some scripts at system level.

```bash
# Install nodejs the way you prefer. See https://nodejs.org/en/download/

# Install PM2 to keep the process running in the background
npm install -g pm2

# Install sonos2mqtt (commandline tool)
npm install -g sonos2mqtt

# Or install a specific version, by appending @3.0.6-beta.3 for example.
# npm install -g sonos2mqtt@3.0.6-beta.3
```

## FHEM configuration

1. Setup MQTT2 Server: `define mqtt2s MQTT2_SERVER 1883 global`
2. Setup a "Bridge" Device and use a Template
   * `define SonosBridge MQTT2_DEVICE`
   * `attr SonosBridge IODev mqtt2s`
   * `set SonosBridge attrTemplate sonos2mqtt_bridge_comfort`
3. Setup auto Start of sonos2mqtt
   * `define n_pm2_sonos notify global:INITIALIZED "pm2 -s start sonos2mqtt"`
4. Startup sonos2mqtt `{qx(pm2 start sonos2mqtt)}`
5. You're done

## More information

You can probably integrated sonos2mqtt with several home-automation services, but we cannot support all of them.

* [Heinz-Otto FHEM and sonos2mqtt blogpost](https://heinz-otto.blogspot.com/2020/05/sonos2mqtt-so-weit-bin-ich.html) (German).
* [FHEM forum topic](https://forum.fhem.de/index.php/topic,111711.0/topicseen.html) (German)
