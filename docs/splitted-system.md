---
layout: default
title: Splitted system (S1 & S2)
nav_order: 12
---

# Splitted system
{: .no_toc }

It is possible to use sonos2mqtt if you have a splitted system (running old sonos speakers in a S1 version, and the new once in S2), but it requires some extra configuration.
Be sure to read the [getting started](getting-started.html) first.

This apps asks the first speaker which other speakers it knows, and then subscribes for events from those speakers.
The event endpoint has to be different so the app will know which speaker the events belong to.
As a user you also want to know which speakers you're controlling so that is why the prefix has to be different.

## Needed config changes

| Setting | Instance 1 | Instance 2 |
|:---------|:------------|:------------|
|`SONOS_LISTENER_HOST`|`{ip-of-docker-host}`|`{ip-of-docker-host}`|
|`SONOS_LISTENER_PORT`| `6329` or not set | `6328` |
|`SONOS2MQTT_DEVICE` | `{ip-of-v1-speaker}` | `{ip-of-v2-speaker}`|
|`SONOS2MQTT_PREFIX`| `sonos` or not set | `sonosv2` |

If you use the above settings your v1 speakers will keep functioning as previous, and your v2 speakers will have a different prefix `sonosv2`.

## Docker-compose

With the file below you can setup sonos2mqtt with a splitted system. Be sure to change `SONOS_LISTENER_HOST` to the IP of your docker host. And `SONOS2MQTT_DEVICE` to the IP's of your sonos speakers.

```yaml
version: "3.7"
services:
  sonos:
    image: svrooij/sonos2mqtt
    restart: unless-stopped
    ports:
      - "6329:6329"
    environment:
      - SONOS2MQTT_DEVICE=192.168.50.14 # Sonos S1 speaker IP
      - SONOS2MQTT_MQTT=mqtt://emqx:1883 # EMQX is a nice mqtt broker
      - SONOS_LISTENER_HOST=192.168.50.44 # Docker host IP
      - SONOS_TTS_ENDPOINT=http://sonos-tts:5601/api/generate # If you deployed the TTS with the same docker-compose
    depends_on:
      - emqx
  
  sonos:
    image: svrooij/sonos2mqtt
    restart: unless-stopped
    ports:
      - "6328:6328"
    environment:
      - SONOS2MQTT_DEVICE=192.168.50.34 # Sonos S2 speaker IP
      - SONOS2MQTT_MQTT=mqtt://emqx:1883 # EMQX is a nice mqtt broker
      - SONOS2MQTT_PREFIX=sonosv2 # Other prefix so you can control both instances
      - SONOS_LISTENER_HOST=192.168.50.44 # Docker host IP
      - SONOS_LISTENER_PORT=6328 # Other port to listen for events
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