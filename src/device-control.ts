import { SonosCommands } from "./sonos-commands";

export class DeviceControl {
  public readonly command?: SonosCommands;
  public readonly replyTopic?: string;
  constructor(command?: string, public readonly sonosCommand?: string, public readonly input?: unknown) {
    if(command !== undefined && Object.values(SonosCommands).some(v => v === command.toLowerCase())) {
      this.command = command.toLowerCase() as SonosCommands;
    }

    
    if(command === SonosCommands.AdvancedCommand && (input as any).reply) {
      this.replyTopic = (input as any).reply;
    }
  }

  isValid(): boolean {
    return this.command !== undefined || this.sonosCommand !== undefined
  }
}
