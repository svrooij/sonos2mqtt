import { SonosDevice } from "@svrooij/sonos";
import { PlayMode } from "@svrooij/sonos/lib/models";
import { DeviceControl } from "./device-control";
import { SonosCommands } from "./sonos-commands";

export class SonosCommandMapping {
  static async ExecuteControl(device: SonosDevice, control: DeviceControl): Promise<any> {
    if(control.command !== undefined) {
      return await SonosCommandMapping.ExecuteCommand(device, control.command, control.input)
    } else if(control.sonosCommand !== undefined) {
      return await device.ExecuteCommand(control.sonosCommand, control.input)
    }
  }
  static async ExecuteCommand(device: SonosDevice, command: SonosCommands, payload: any): Promise<any> {
    switch(command) {
      case SonosCommands.AdvancedCommand:
        if (payload.cmd)
          return await device.ExecuteCommand(payload.cmd, payload.val)
        break;

      case SonosCommands.Command:
        if (payload.cmd && Object.values(SonosCommands).some(v => v === payload.cmd))
          return SonosCommandMapping.ExecuteCommand(device, payload.cmd as SonosCommands, payload.val)
        break;

      case SonosCommands.JoinGroup:
        if(typeof payload === 'string')
          return await device.JoinGroup(payload)
        break;

      case SonosCommands.LeaveGroup:
        return await device.AVTransportService.BecomeCoordinatorOfStandaloneGroup()

      case SonosCommands.Mute:
        return await device.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: true })

      case SonosCommands.Next:
        return await device.AVTransportService.Next();

      case SonosCommands.Notify:
        return await device.PlayNotification(payload);

      case SonosCommands.Pause:
        return await device.Pause();

      case SonosCommands.Play:
        return await device.Play();

      case SonosCommands.PlayMode:
        if (typeof payload === 'string')
          return device.AVTransportService.SetPlayMode({ InstanceID: 0, NewPlayMode: payload as PlayMode })
        break;

      case SonosCommands.Previous:
        return await device.Previous();

      case SonosCommands.Queue:
        if(typeof payload === 'string')
          return await device.AddUriToQueue(payload);
        return await device.AddUriToQueue(payload.trackUri, payload.positionInQueue, payload.enqueueAsNext)

      case SonosCommands.Seek:
        return await device.SeekPosition(payload)

      case SonosCommands.SelectTrack:
        if(typeof payload === 'number')
          return await device.SeekTrack(payload)
        break;

      case SonosCommands.SetTransportUri:
        return await device.SetAVTransportURI(payload)

      case SonosCommands.Sleep:
        if(typeof payload === 'number') {
          if(payload >= 1 && payload <= 60){
            return await device.AVTransportService.ConfigureSleepTimer({InstanceID: 0, NewSleepTimerDuration: `00:${payload.toString().padStart(2,'0')}:00`})
          }
        } else if (typeof payload === 'string') {
          return await device.AVTransportService.ConfigureSleepTimer({InstanceID: 0, NewSleepTimerDuration: payload})
        }
        break;

      case SonosCommands.Speak:
        if(typeof payload === "object") {
          return await device.PlayTTS(payload)
        }
        break;

      case SonosCommands.Stop:
        return await device.Stop();

      case SonosCommands.Toggle:
        return await device.TogglePlayback();

      case SonosCommands.Unmute:
        return device.RenderingControlService.SetMute({ InstanceID: 0, Channel: 'Master', DesiredMute: false })

      case SonosCommands.Volume:
        if(typeof payload === 'number')
          return await device.SetVolume(payload)
        break;

      case SonosCommands.VolumeDown:
        return await device.RenderingControlService.SetRelativeVolume({ 
          InstanceID: 0, Channel: 'Master', 
          Adjustment: ((typeof payload === 'number') ? payload : 4) * -1})
          
      case SonosCommands.VolumeUp:
        return await device.RenderingControlService.SetRelativeVolume({ 
          InstanceID: 0, Channel: 'Master', 
          Adjustment: ((typeof payload === 'number') ? payload : 4)})
      
      default:
        throw new Error(`Command '${command}' not implemented`)
    }
  }
}
