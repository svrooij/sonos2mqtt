---
layout: default
title: Global commands
nav_order: 8
---

# Global commands
{: .no_toc }

We also made some commands that aren't specificly tied to a speaker. All global commands should be send to the following topic.

Topic: `[prefix]/cmd/[global_command]` eg. `sonos/cmd/pauseall`.

## Commands

|Command|Description|Input|
|-------|-----------|-----|
|`notify`|Play a notification on all groups|See [notifications](control/notifications.html) |
|`speak`|Play a text-to-speech message on all speakers| See [text-to-speech](control/notifications.html#text-to-speech) |
|`pauseall`|Pause all speakers| - |
|`listalarms`|Fetch all alarms and post to `sonos/alarms`| - |
|`setalarm`|Set some properties of the alarm. | JSON object like you got from listing alarms.|
|`setlogging`|Change logging level at runtime.| `off` / `error` / `warning` / `information` / `debug` / `verbose`|
|`check-subscriptions`|Force refreshing the events that trigger everything in this app. After power cuts for instance.| - |
