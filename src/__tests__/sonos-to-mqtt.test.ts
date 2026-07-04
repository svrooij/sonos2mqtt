import { createServer } from 'net'
import { Aedes } from 'aedes'
import { EventEmitter } from 'events'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@svrooij/sonos', () => {
  const mockDevice = {
    Uuid: 'RINCON_TEST0000000001400',
    Name: 'Test Speaker',
    GroupName: 'Test Speaker',
    Volume: 20,
    CurrentTrackUri: undefined as string | undefined,
    CurrentTransportStateSimple: undefined,
    Coordinator: { Uuid: 'RINCON_TEST0000000001400' },
    Events: new EventEmitter(),
    GetDeviceDescription: vi.fn().mockResolvedValue({ modelName: 'Sonos Play:1' }),
    CancelEvents: vi.fn(),
  }

  class SonosManager {
    Devices = [mockDevice]
    InitializeFromDevice = vi.fn().mockResolvedValue(true)
    InitializeWithDiscovery = vi.fn().mockResolvedValue(true)
    CheckAllEventSubscriptions = vi.fn().mockResolvedValue(undefined)
    PlayNotification = vi.fn().mockResolvedValue(true)
    PlayTTS = vi.fn().mockResolvedValue(true)
  }

  const SonosEvents = {
    AVTransport: 'avtransport',
    CurrentTrackUri: 'currentTrackUri',
    CurrentTrackMetadata: 'currentTrack',
    EnqueuedTransportUri: 'enqueuedTransportUri',
    EnqueuedTransportMetadata: 'enqueuedTransport',
    NextTrackUri: 'nextTrackUri',
    NextTrackMetadata: 'nextTrack',
    CurrentTransportState: 'transportState',
    CurrentTransportStateSimple: 'simpleTransportState',
    PlaybackStopped: 'playbackStopped',
    RenderingControl: 'renderingcontrol',
    Mute: 'muted',
    Volume: 'volume',
    Coordinator: 'coordinator',
    GroupId: 'groupid',
    GroupName: 'groupname',
    SubscriptionError: 'subscriptionError',
  }

  return { SonosManager, SonosEvents }
})

import { SonosToMqtt } from '../sonos-to-mqtt'
import { Config } from '../config'

describe('SonosToMqtt smoke test', () => {
  let broker: Aedes
  let server: ReturnType<typeof createServer>
  let port: number

  beforeEach(async () => {
    broker = await Aedes.createBroker()
    server = createServer(broker.handle)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as { port: number }).port
  })

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      broker.close(() => server.close(() => resolve()))
    })
  })

  it('starts up and connects to MQTT with a known device', async () => {
    const config: Config = {
      mqtt: `mqtt://127.0.0.1:${port}`,
      prefix: 'sonos-test',
      wait: 1,
      distinct: false,
      device: '192.168.1.100',
      discovery: false,
      log: 'warning',
      friendlynames: 'name',
    }

    const app = new SonosToMqtt(config)
    const started = await app.start()
    expect(started).toBe(true)

    // Wait for MQTT to connect and publish status
    const connected = await new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('MQTT connection timed out')), 3000)
      broker.on('publish', (packet) => {
        if (packet.topic === 'sonos-test/connected') {
          clearTimeout(timeout)
          resolve(true)
        }
      })
    })

    expect(connected).toBe(true)

    app.stop()
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
  })

  it('stops cleanly without errors', async () => {
    const config: Config = {
      mqtt: `mqtt://127.0.0.1:${port}`,
      prefix: 'sonos-test',
      wait: 1,
      distinct: false,
      device: '192.168.1.100',
      discovery: false,
      log: 'warning',
      friendlynames: 'name',
    }

    const app = new SonosToMqtt(config)
    await app.start()

    // Wait briefly for setup to complete
    await new Promise<void>((resolve) => setTimeout(resolve, 200))

    expect(() => app.stop()).not.toThrow()
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
  })
})
