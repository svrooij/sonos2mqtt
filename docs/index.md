---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
title: Home
nav_order: 1
permalink: /
---

# Sonos2mqtt

[![Sonos2mqtt][badge_sonos-mqtt]][link_sonos-mqtt]
[![npm][badge_npm]][link_npm]
[![Sonos api documentation][badge_sonos-docs]][link_sonos-docs]
[![Sonos typescript this library][badge_sonos-typescript]][link_sonos-typescript]
[![Sonos cli][badge_sonos-cli]][link_sonos-cli]
[![Join us on Discord][badge_discord]][link_discord]

[![github issues][badge_issues]][link_issues]
[![docker pulls][badge_docker]][link_docker]
[![Downloads/week](https://img.shields.io/npm/dw/sonos2mqtt.svg?style=for-the-badge)](https://npmjs.org/package/sonos2mqtt)
[![License](https://img.shields.io/npm/l/sonos2mqtt.svg?style=for-the-badge)](https://github.com/svrooij/sonos2mqtt/blob/master/package.json)
[![Support me on Github][badge_sponsor]][link_sponsor]
[![All Contributors][badge_contrib]](#contributors-)

This node application is a bridge between the Sonos and a mqtt server. The status of all your sonos devices will be published to mqtt and you can control the sonos speakers over mqtt.

This library is in no way connected to [Sonos](//en.wikipedia.org/wiki/Sonos). It's just a library to control their speakers from your mqtt server.

## Key features

- Using local push for immediate state changes.
- Talking straight to the sonos device (no cloud involved).
- Supporting **all** sonos actions

## Documentation

- [Getting started](getting-started.html)
- [Splitted system (S1 and S2 speakers)](splitted-system.html)
- [Topic](topics.html)
- [Controlling speakers](control)
- [Global commands](global-commands.html)
- [Development](development.html)
- [Contributors](#contributors-)

---

## Sonos library (typescript/node)

This app uses [node-sonos-ts][link_sonos-typescript] to talk to the sonos speakers. And can easily be integrated in all kind of other apps.

## Text-to-speech server

[sonos-tts-polly](https://github.com/svrooij/node-sonos-tts-polly) is a perfect companion for this library. It will act as a [text-to-speech](https://svrooij.io/node-sonos-ts/sonos-device/notifications-and-tts.html#text-to-speech) server. Generating mp3s for some text and playing it on all your speakers.

All [sponsors][link_sponsor] get a hosted TTS endpoint, for instant text to speech support.

## Sonos CLI

Not really an mqtt guy/girl? I also created a small [sonos cli][link_sonos-cli] to control your speakers from the command line.

```shell
npm i -g @svrooij/sonos-cli
sonos control office next
```

## Beer or Coffee

I'm a big fan of beer and coffee. To provide something extra to everybody who is sponsoring me, I'll provide a hosted TTS server for all my sponsors.

This bridge and the [sonos package][link_sonos-typescript] took me a lot of hours to build, so I invite everyone using it to at least have a look at my [Sponsor page][link_sponsor]. Even though the sponsoring tiers are monthly you can also cancel anytime :wink:

## Special thanks

The latest version of this bridge is inspired on [hue2mqtt.js](https://github.com/hobbyquaker/hue2mqtt.js) by [Sabastian Raff](https://github.com/hobbyquaker). That was a great sample on how to create a globally installed, command-line, something2mqtt bridge.

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
  </tr>
  <tr>
    <td align="center"><a href="http://dgmltn.com"><img src="https://avatars3.githubusercontent.com/u/698270?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Doug Melton</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/issues?q=author%3Adgmltn" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://sebbo.net/"><img src="https://avatars.githubusercontent.com/u/812398?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sebastian</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=sebbo2002" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/evenisse"><img src="https://avatars.githubusercontent.com/u/682743?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Emmanuel Venisse</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=evenisse" title="Documentation">📖</a></td>
    <td align="center"><a href="http://jonasmhansen.com"><img src="https://avatars.githubusercontent.com/u/1939229?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jonas Hansen</b></sub></a><br /><a href="https://github.com/svrooij/sonos2mqtt/commits?author=JonasMH" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

[badge_contrib]: https://img.shields.io/github/all-contributors/svrooij/sonos2mqtt?style=for-the-badge
[badge_docker]: https://img.shields.io/docker/pulls/svrooij/sonos2mqtt?style=for-the-badge&logo=docker
[badge_discord]: https://img.shields.io/discord/782374564054564875?style=for-the-badge&logo=discord
[badge_issues]: https://img.shields.io/github/issues/svrooij/sonos2mqtt?style=for-the-badge&logo=github
[badge_npm]: https://img.shields.io/npm/v/sonos2mqtt?style=for-the-badge
[badge_sonos-cli]: https://img.shields.io/badge/sonos-cli-blue?style=for-the-badge&logo=sonos
[badge_sonos-docs]: https://img.shields.io/badge/sonos-api-blue?style=for-the-badge&logo=sonos
[badge_sonos-mqtt]: https://img.shields.io/badge/sonos-mqtt-blue?style=for-the-badge&logo=sonos
[badge_sonos-typescript]: https://img.shields.io/badge/sonos-typescript-blue?style=for-the-badge&logo=sonos
[badge_sponsor]: https://img.shields.io/github/sponsors/svrooij?style=for-the-badge&logo=github

[link_discord]: https://discord.gg/VMtG6Ft36J
[link_docker]: https://hub.docker.com/r/svrooij/sonos2mqtt
[link_issues]: https://github.com/svrooij/sonos2mqtt/issues
[link_npm]: https://www.npmjs.com/package/sonos2mqtt
[link_sonos-cli]: https://github.com/svrooij/sonos-cli
[link_sonos-docs]: https://svrooij.io/sonos-api-docs
[link_sonos-mqtt]: https://svrooij.io/sonos2mqtt
[link_sonos-typescript]: https://svrooij.io/node-sonos-ts
[link_sponsor]: https://github.com/sponsors/svrooij
