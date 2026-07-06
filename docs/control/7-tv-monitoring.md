---
layout: default
title: Soundbar management
parent: Control speakers
nav_order: 7
permalink: /control/tv-monitoring.html
---

# TV Monitoring

People having a Sonos soundbar, often have other players in the living room or downstairs as well. My soundbar is configured to leave the group it's in as soon as the TV starts. This is nice on one hand, in that we don't hear TV sounds from the kitchen. But it is annoying if you want to listen to music in the same area (Kitchen and soundbar).

With TV monitoring your getting these features:

- Auto-join Soundbar to old group
- Change volume once TV starts
- Revert volume to previous before joining the music group

## Configure TV monitoring

First you have to make sure to have another Speaker as a coordinator for the music in that area. In our case the Kitchen speaker.

Just add these properties to your docker (or other) configuration.

- `SONOS2MQTT_TV_UUID=RINCON_soundbar01400`
- `SONOS2MQTT_TV_GROUP=RINCON_kitchen01400`
- `SONOS2MQTT_TV_VOLUME=25` (optional)

Once you added these values, you just restart sonos2mqtt and the message `Setting up TV monitoring` should appear in the logs.
