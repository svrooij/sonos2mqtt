export enum SonosCommands {
  AdvancedCommand = 'adv-command',
  ClearQueue = 'clearqueue',
  Command = 'command',
  JoinGroup = 'joingroup',
  LeaveGroup = 'leavegroup',
  Mute = 'mute',
  Next = 'next',
  Notify = 'notify',
  /**
   * @deprecated Experimental see https://github.com/svrooij/node-sonos-ts/issues/119
   */
  NotifyTwo = 'notifytwo',
  Pause = 'pause',
  Play = 'play',
  PlayMode = 'playmode',
  Previous = 'previous',
  Queue = 'queue',
  Seek = 'seek',
  SelectTrack = 'selecttrack',
  SetTransportUri = 'setavtransporturi',
  Sleep = 'sleep',
  Speak = 'speak',
  /**
   * @deprecated Experimental see https://github.com/svrooij/node-sonos-ts/issues/119
   */
  SpeakTwo = 'speaktwo',
  Stop = 'stop',
  SwitchToLine = "switchtoline",
  SwitchToQueue = "switchtoqueue",
  SwitchToTv = "switchtotv",
  Toggle = 'toggle',
  Unmute = 'unmute',
  Volume = 'volume',
  VolumeDown = 'volumedown',
  VolumeUp = 'volumeup'
}
