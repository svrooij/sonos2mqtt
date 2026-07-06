export enum SonosCommands {
  AdvancedCommand = 'adv-command',
  ClearQueue = 'clearqueue',
  Command = 'command',
  Crossfade = 'crossfade',
  GroupVolume = 'groupvolume',
  GroupVolumeDown = 'groupvolumedown',
  GroupVolumeUp = 'groupvolumeup',
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
  Repeat = 'repeat',
  Seek = 'seek',
  SelectTrack = 'selecttrack',
  SetBass = 'setbass',
  SetButtonLockState = 'setbuttonlockstate',
  SetLEDState = 'setledstate',
  SetNightMode = 'setnightmode',
  SetTransportUri = 'setavtransporturi',
  SetTreble = 'settreble',
  Shuffle = 'shuffle',
  Sleep = 'sleep',
  Snooze = 'snooze',
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
