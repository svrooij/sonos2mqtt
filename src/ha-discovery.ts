import { SonosDevice } from "@svrooij/sonos/lib";

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
  private static deviceDescriptionForSonos(sonos: SonosDevice, description: any): AutoDiscoveryDevice {
    return {
      identifiers: [sonos.Uuid],
      manufacturer: description.manufacturer,
      model: description.modelName,
      name: sonos.Name,
      sw_version: description.softwareVersion,
      connections: [["host", `${sonos.Host}:${sonos.Port}`]]
    };
  }

  private static autoDiscoverMediaPlayer(name: string, uuid: string, device: AutoDiscoveryDevice, prefix: string, discoveryPrefix: string): AutoDiscoveryMessage {
    return {
      topic: `${discoveryPrefix}/media_player/${uuid}/${prefix}/config`,
      payload: {
        device: device,
        device_class: 'speaker',
        icon: 'mdi:speaker',
        name: name,
        state_topic: `${prefix}/${uuid}`,
        command_topic: `${prefix}/${uuid}/control`,
        unique_id: `sonos2mqtt_${uuid}_speaker`
      }
    } as AutoDiscoveryMessage
  }

  private static autoDiscoverCrossfadeSwitch(name: string, uuid: string, device: AutoDiscoveryDevice, prefix: string, discoveryPrefix: string): AutoDiscoveryMessage {
    return {
      topic: `${discoveryPrefix}/switch/${uuid}_crossfade/${prefix}/config`,
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

  public static async GenerateAutoDiscoveryMessages(sonos: SonosDevice, prefix = 'sonos', discoveryPrefix = 'homeassistant'): Promise<AutoDiscoveryMessage[]> {
    const description = await sonos.GetDeviceDescription();
    const deviceDescription = HaAutoDiscovery.deviceDescriptionForSonos(sonos, description);
    return [
      HaAutoDiscovery.autoDiscoverMediaPlayer(sonos.Name, sonos.Uuid, deviceDescription, prefix, discoveryPrefix),
      HaAutoDiscovery.autoDiscoverCrossfadeSwitch(sonos.Name, sonos.Uuid, deviceDescription, prefix, discoveryPrefix)
    ];
  }
}
