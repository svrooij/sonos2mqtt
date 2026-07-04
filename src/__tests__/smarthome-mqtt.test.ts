import { createServer } from 'net'
import { Aedes } from 'aedes'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SmarthomeMqtt } from '../smarthome-mqtt'

describe('SmarthomeMqtt', () => {
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

  it('connects to MQTT broker and emits connected event', async () => {
    const mqtt = new SmarthomeMqtt(`mqtt://127.0.0.1:${port}`, 'test')

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), 3000)
      mqtt.Events.on('connected', (connected) => {
        if (connected) {
          clearTimeout(timeout)
          resolve()
        }
      })
      mqtt.connect()
    })

    mqtt.close()
  })

  it('publishes status after connecting', async () => {
    const mqtt = new SmarthomeMqtt(`mqtt://127.0.0.1:${port}`, 'test')

    const publishedTopics: string[] = []
    broker.on('publish', (packet) => {
      if (!packet.topic.startsWith('$SYS')) {
        publishedTopics.push(packet.topic)
      }
    })

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), 3000)
      mqtt.Events.on('connected', (connected) => {
        if (connected) {
          clearTimeout(timeout)
          resolve()
        }
      })
      mqtt.connect()
    })

    mqtt.publishStatus('2')
    await new Promise<void>((resolve) => setTimeout(resolve, 100))

    expect(publishedTopics).toContain('test/connected')

    mqtt.close()
  })

  it('emits disconnected event on close', async () => {
    const mqtt = new SmarthomeMqtt(`mqtt://127.0.0.1:${port}`, 'test')

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), 3000)
      mqtt.Events.on('connected', (connected) => {
        if (connected) {
          clearTimeout(timeout)
          resolve()
        }
      })
      mqtt.connect()
    })

    const disconnected = new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Disconnect timed out')), 3000)
      mqtt.Events.on('connected', (connected) => {
        if (!connected) {
          clearTimeout(timeout)
          resolve(true)
        }
      })
    })

    mqtt.close()
    expect(await disconnected).toBe(true)
  })
})
