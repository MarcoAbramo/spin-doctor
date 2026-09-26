import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app'
import { readEnv } from '../src/env'

const env = readEnv({ NODE_ENV: 'test' })

describe('GET /health', () => {
  it('works without a database', async () => {
    const app = await buildApp({ env })
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'ok', db: 'not-configured' })
  })

  it('reports a degraded status when the database is down', async () => {
    const app = await buildApp({ env, db: { ping: async () => false } })
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.json()).toMatchObject({ status: 'degraded', db: 'down' })
  })

  it('serves the OpenAPI document', async () => {
    const app = await buildApp({ env })
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/docs/json' })
    expect(res.statusCode).toBe(200)
    expect(res.json().info.title).toBe('Spin Doctor API')
  })
})
