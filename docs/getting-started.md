---
layout: default
title: Getting started
nav_order: 2
---

# Getting started
{: .no_toc }

Using sonos2mqtt is really easy.

1. TOC
{:toc}

---

## Prerequisites

- (local) mqtt server
- always on (single board) computer

## Run sonos2mqtt in docker

- [Sonos2mqtt on docker hub](https://hub.docker.com/r/svrooij/sonos2mqtt)

Using this library in docker is the preferred way.

1. Create an `.env` file with the following settings.
2. Set the required values.
3. Run `docker run --env-file .env -p 6329:6329 svrooij/sonos2mqtt`

```shell
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

See [configuration](#configuration) for additional settings.

This app makes heavy use of events, so you'll have to make sure they still work. That is why you need to expose the listening port (`6329`), changing the port will cause problems. The library will automaticcally subscribe to events from the sonos device, but because you're running in docker it cannot figure out the IP by itself. You set the IP of the docker host in the `SONOS_LISTENER_HOST` environment variable. This is how the events flow.

```
================              ===============              ==============
| Sonos Device |  == HTTP =>  | Docker host |  == HTTP =>  | sonos2mqtt |
================              ===============              ==============
```

We automatically build a multi-architecture image for `amd64`, `arm64`, `armv7` and `i386`. This means you can run sonos2mqtt in docker on almost any device.

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

You can also use sonos2mqtt on every device that has node installed. The latest LTS (long-time-support) version is always recommended, but it should run on v10 or higher. When creating an issue please verify that you're on the latest LTS (v12 for now) or higher.

`sudo npm install -g sonos2mqtt`

You have to make sure it runs in the background yourself. You could check out [PM2](https://pm2.keymetrics.io/docs/usage/process-management/) for a node process manager (for auto restarts in case of crash).

## Configuration

Every setting of this library can be set with environment variables prefixed with `SONOS2MQTT_`. Like `SONOS2MQTT_PREFIX=music` to change the topic prefix to `music`.

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
  --friendlynames    Use device name or uuid in topics (except the united topic,
                     always uuid)                      [choices: "name", "uuid"]
  --version          Show version number                               [boolean]
```

### Configuration by json file

Some systems don't like the preferred docker way of configuration (which is environment settings), so it will also check for a json file when starting up.

- Default path: `/data/config.json`
- Override by setting: `CONFIG_PATH`

Sample file:

```json
{
  "mqtt": "",
  "prefix": "sonos",
  "distinct": false,
  "device": "192.168.x.x",
  "ttslang": "en-US",
  "ttsendpoint": "",
  "discovery": false,
  "discoveryprefix": "homeassistant",
  "log": "information",
  "clientid": "",
  "friendlynames": "name"
}
```
