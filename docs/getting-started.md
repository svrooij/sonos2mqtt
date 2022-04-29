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

## Sonos2mqtt details

| What | Value |
|------|-------|
| Docker image | `ghcr.io/svrooij/sonos2mqtt:latest` or `svrooij/sonos2mqtt:latest`|
| Docker image (beta) | `ghcr.io/svrooij/sonos2mqtt:beta` or `svrooij/sonos2mqtt:beta`|
| NPM | `https://www.npmjs.com/package/sonos2mqtt` |

## Configuration

Every setting of this library can be set with environment variables prefixed with `SONOS2MQTT_`. Like `SONOS2MQTT_PREFIX=music` to change the topic prefix to `music`.

```bash
sonos2mqtt 0.0.0-development
A smarthome bridge between your sonos system and a mqtt server.

Usage: index.js [options]

Options:
      --prefix           instance name. used as prefix for all topics   [default: "sonos"]
      --mqtt             mqtt broker url. See
                         https://svrooij.io/sonos2mqtt/getting-started.html#configuration
                                                             [default: "mqtt://127.0.0.1"]
      --clientid         Specify the client id to be used
      --wait             Number of seconds to search for a speaker, until exit
                                                                    [number] [default: 30]
      --log              Set the loglevel
                     [choices: "warning", "information", "debug"] [default: "information"]
  -d, --distinct         Publish distinct track states          [boolean] [default: false]
  -h, --help             Show help                                               [boolean]
      --ttslang          Default TTS language                           [default: "en-US"]
      --ttsendpoint      Default endpoint for text-to-speech
      --device           Start with one known IP instead of device discovery.
      --discovery        Emit retained auto-discovery messages for each player.
                                                                [boolean] [default: false]
      --discoveryprefix  The prefix for the discovery messages  [default: "homeassistant"]
      --friendlynames    Use device name or uuid in topics (except the united topic,
                         always uuid)                            [choices: "name", "uuid"]
      --version          Show version number  
```

You can configure the **mqtt** url by setting a supported [URL](https://nodejs.org/api/url.html#url_constructor_new_url_input_base).

Most used format is `mqtt(s)://[user]:[password]@[host]:[port]` like `mqtt://user:password@hostname:1883`, or `mqtts://user:password@hostname:8883` for a mqtt server supporting TLS.

### Configuration by json file

Some systems don't like the preferred docker way of configuration (which is environment settings), so it will also check for a json file when starting up.

- Default path: `/data/options.json`
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

## Run Sonos2mqtt with docker-compose

We automatically build a multi-architecture image for `amd64`, `arm64`, `armv7` and `i386`. This means you can run sonos2mqtt in docker on almost any device.

```yaml
version: "3.7"
services:
  sonos:
    image: ghcr.io/svrooij/sonos2mqtt
    # or the dockerhub svrooij/sonos2mqtt
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
      - SONOS_TTS_CACHE_URI=http://192.168.50.44:5601/cache

# Optional MQTT server (I like emqx over mosquitto)
  emqx:
    image: emqx/emqx
    restart: unless-stopped
    ports:
      - "1883:1883"
      - "18083:18083"
```

## Run sonos2mqtt with docker

1. Create an `.env` file with the following settings.
2. Set the required values.
3. Run `docker run --env-file .env -p 6329:6329 ghcr.io/svrooij/sonos2mqtt`

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

## Run sonos2mqtt with node

While you can run sonos2mqtt on bare metal (or a VM), it's best avoided. It means you're also responsible for making sure it's restarted if there is an error. You can use a process manager for that task like, [PM2](https://pm2.keymetrics.io/docs/usage/process-management/) but setting it up is not supported by us.

Install the app globally `sudo npm install -g sonos2mqtt`

And start the app `sonos2mqtt --mqtt mqtt://mqtt-host:1883 --device {sonos_ip_or_hostname}`

## Events explained

**Sonos2mqtt** doesn't use any pull mechanism, it uses event subscriptions to get notified as soon as something on the speakers changes. Once this app is started, it tries to get an ip that should be used in the callback url. If you run this application inside docker, the application has no idea what the  local ip of the machine running this application is.

That is why you have to tell the application the local ip of the docker host with the `SONOS_LISTENER_HOST` environment variable.

{% raw %}
<pre class="mermaid">
sequenceDiagram;
    participant s2m as Sonos2MQTT
    participant d as docker
    participant s as Sonos Speaker
    Note right of s2m: Create new subscription
    s2m-->>d: What ip is reachable for sonos speaker?
    d-->>s2m: Use this IP
    s2m->>s: Send service updates to http://ip:port please?
    s->>s2m: Here is your subscription ID
    Note right of s2m: Wait for updates
    loop When there is an update
        s->>d: "Service update" to (http://docker-ip:port)
        d->>s2m: "Service update" to (http://sonos2mqtt-ip:port)
        s2m->>s: Update received
    end
    Note right of s2m: Unsubscribe
    s2m-->>s: Cancel subscription with ID?
    s-->>s2m: Ok
</pre>
{% endraw %}

### Event troubleshooting

If you don't see any messages from your sonos speaker, check the output of the container first. It should give you some good pointers.

We have a status page available for the event listener, at `http://ip:6329/status` where you should see a json document describing all the sonos subscriptions. If this doesn't work, try through the following steps one by one until it works:

1. Verify `SONOS_LISTENER_HOST` is set to the host machine ip
2. Verify port `6329` has been bound in docker (See the `docker-compose.yml` below)
3. Create an exception for `6329` in the firewall
4. Make sure port `6329` is not in use by another service

<script src="{{ "/assets/mermaid-8.14.0/mermaid.min.js" | relative_url }}"></script>
 <script>
 mermaid.initialize({startOnLoad:true});
</script>