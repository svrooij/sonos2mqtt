import { Track, ChannelValue, ExtendedTransportState, Repeat } from '@svrooij/sonos/lib/models'
/**
 * Object that keeps the state of each device,
 * this is what is changed by the events and published to mqtt as a full object.
 *
 * @remarks If you want to add stuff also add it to the event handlers. 
 * @export
 * @interface SonosState
 */
export interface SonosState extends SonosStateBase {
  readonly uuid: string;
  readonly model: string;
  ts: number;
  name: string;
  groupName: string;
  coordinatorUuid: string;
  members?: Member[];
  volume: ChannelValue<number>;
  mute: ChannelValue<boolean>;
  currentTrack: Track | string;
  position: PositionInfo;
  nextTrack: Track | string;
  enqueuedMetadata: TrackWithQueueInfo | string;
  transportState: ExtendedTransportState;
  playmode: string;
  bass: number;
  treble: number;
  crossfade: string;
  shuffle: boolean;
  repeat: Repeat;
}

interface SonosStateBase {
  [key: string]: string | boolean | number | Track | ChannelValue<number> | ChannelValue<boolean> | ExtendedTransportState | PositionInfo | TrackWithQueueInfo | Member[] | undefined;
}

interface PositionInfo {
  Position: string;
  LastUpdate: number;
}

interface TrackWithQueueInfo extends Track {
  QueueLength?: number;
  QueuePosition?: number;
}

interface Member {
  Uuid: string;
  Name: string;
}
