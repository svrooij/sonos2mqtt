---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
title: Development
nav_order: 15
permalink: /development
---

# Development
{: .no_toc }

This library is hosted on [Github](https://github.com/svrooij/sonos2mqtt), contributions are more then welcome.

1. TOC
{:toc}

---

## Fork library

You should start by creating a [fork](https://github.com/svrooij/sonos2mqtt/fork). Or if you already had a fork sync the fork:

```shell
# Add the remote, call it "upstream": (only once)
git remote add upstream https://github.com/svrooij/sonos2mqtt.git

# Fetch all the branches of that remote into remote-tracking branches,
# such as upstream/master:
git fetch upstream

# Make sure that you're on your master branch:
git checkout master

# Rewrite your master branch so that any commits of yours that
# aren't already in upstream/master are replayed on top of that
# other branch:
git rebase upstream/master
```

## Compile the library

Before you can use this library is has to be compiled.

`npm run install && npm run build`

## Run the tests

After changing somehting you should run the tests (as they are automatically run before your PR is accepted).

`npm run test`

It's also important to start the app and test it in your local environment. If you don't want to use your production mqtt server. Just start a temporary one with docker.

## Debugging

This library has a VSCode launch file (`.vscode/launch.json`). You should be able to debug the library in VSCode with breakpoints and everything. The launch file is configured to load a `.env` file from the root of the library.

Create a `.env` file in the root with the following config:

```bash
# Setting the Sonos device to start with
SONOS2MQTT_DEVICE=192.168.x.x

# Change default mqtt server
# SONOS2MQTT_MQTT=mqtt://some.host:port

# Text-to-speech stuff https://svrooij.io/node-sonos-ts/sonos-device/notifications-and-tts.html#text-to-speech
# SONOS_TTS_ENDPOINT=https://sonos-tts:5601/api/generate
# SONOS_TTS_LANG=en-US
```

## Run documentation generator locally

The documentation can be found in [/docs](https://github.com/svrooij/sonos2mqtt/tree/master/docs) and uses Jekyll to convert the markdown to html. To check the generated documenation locally you can use the following script. It uses docker, so it won't install anything on your machine. It also has live reload to you can edit and save and should see the changes instantly.

`npm run serve-docs` or change dir to `docs` and run `docker-compose up`

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://svrooij.nl"><img src="https://avatars2.githubusercontent.com/u/1292510?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Stephan van Rooij</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=svrooij" title="Code">💻</a> <a href="https://github.com/svrooij/sonos2mqtt/commits?author=svrooij" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/cheanrod"><img src="https://avatars3.githubusercontent.com/u/35066927?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sven Werner</b></sub></a><br /><a href="#platform-cheanrod" title="Packaging/porting to new platform">📦</a> <a href="https://github.com/svrooij/sonos2mqtt/commits?author=cheanrod" title="Code">💻</a></td>
    <td align="center"><a href="https://mi.o-o.im"><img src="https://avatars0.githubusercontent.com/u/7872104?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matthias Burgfried</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=matthias-burgfried" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mqtt-fan"><img src="https://avatars1.githubusercontent.com/u/32242849?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mqtt-fan</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=mqtt-fan" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/roth"><img src="https://avatars3.githubusercontent.com/u/716931?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Martin Roth</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=roth" title="Documentation">📖</a></td>
    <td align="center"><a href="http://dgmltn.com"><img src="https://avatars3.githubusercontent.com/u/698270?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Doug Melton</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/issues?q=author%3Adgmltn" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://sebbo.net/"><img src="https://avatars.githubusercontent.com/u/812398?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sebastian</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=sebbo2002" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

**Tag** the [all-contributors bot](https://allcontributors.org/docs/en/bot/usage)
in your PR and you will get added automically to the list of contributors.
