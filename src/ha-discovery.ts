import { SonosDevice } from "@svrooij/sonos/lib";
import DeviceDescription from "@svrooij/sonos/lib/models/device-description";

interface AutoDiscoveryDevice {
  identifiers?: string[];
  manufacturer?: string;
  model?: string;
  name?: string;
  sw_version?: string;
  connections?: string[][];
}

interface AutoDiscoveryPayload {
  device?: AutoDiscoveryDevice;
  device_class?: string;
  icon?: string;
  name?: string;
  state_topic?: string;
  unique_id: string;
  availability_topic?: string;
  payload_available?: string;
  value_template?: string;
  state_on?: string;
  state_off?: string;
}

interface AutoDiscoveryPayloadRw extends AutoDiscoveryPayload {
  command_topic: string;
  payload_on?: string;
  payload_off?: string;
}

export interface AutoDiscoveryMessage {
  topic: string;
  payload: AutoDiscoveryPayload | AutoDiscoveryPayloadRw;
}

export class HaAutoDiscovery {
  private static deviceDescriptionForSonos(sonos: SonosDevice, description: DeviceDescription, prefix: string): AutoDiscoveryDevice {
    return {
      identifiers: [sonos.Uuid],
      manufacturer: description.manufacturer,
      model: description.modelName,
      name: sonos.Name,
      sw_version: description.softwareVersion,
      connections: [["host", `${sonos.Host}:${sonos.Port}`], ["mqtt", `${prefix}/${sonos.Uuid}`]]
    };
  }

  private static autoDiscoverMediaPlayer(name: string, uuid: string, device: AutoDiscoveryDevice, prefix: string): AutoDiscoveryMessage {
    return {
      topic: `sonos2mqtt/discovery/${prefix}/${uuid}`,
      payload: {
        device: device,
        device_class: 'speaker',
        icon: 'mdi:speaker',
        name: name,
        state_topic: `${prefix}/${uuid}`,
        command_topic: `${prefix}/${uuid}/control`,
        unique_id: `sonos2mqtt_${uuid}_speaker`,
        availability_topic: `${prefix}/connected`
      }
    } as AutoDiscoveryMessage
  }

  private static autoDiscoverCrossfadeSwitch(name: string, uuid: string, device: AutoDiscoveryDevice, prefix: string, discoveryPrefix: string): AutoDiscoveryMessage {
    return {
      topic: `${discoveryPrefix}/switch/${prefix}/${uuid}_crossfade/config`,
      payload: {
        device: device,
        device_class: 'switch',
        icon: 'mdi:swap-horizontal',
        name: `${name} CrossFade`,
        state_topic: `${prefix}/${uuid}`,
        command_topic: `${prefix}/set/${uuid}/crossfade`,
        unique_id: `sonos2mqtt_${uuid}_crossfade`,
        value_template: "{{ value_json.crossfade }}",
        state_off: "Off",
        state_on: "On",
      }
    } as AutoDiscoveryMessage
  }

  public static async GenerateAutoDiscoveryMessages(sonos: SonosDevice, prefix = 'sonos'): Promise<AutoDiscoveryMessage[]> {
    const description = await sonos.GetDeviceDescription();
    const deviceDescription = HaAutoDiscovery.deviceDescriptionForSonos(sonos, description, prefix);
    return [
      HaAutoDiscovery.autoDiscoverMediaPlayer(sonos.Name, sonos.Uuid, deviceDescription, prefix),
      //HaAutoDiscovery.autoDiscoverCrossfadeSwitch(sonos.Name, sonos.Uuid, deviceDescription, prefix, discoveryPrefix)
    ];
  }
}
