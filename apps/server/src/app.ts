import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify, { type FastifyInstance } from 'fastify'
import type { DbHandle } from './db/client'
import type { Env } from './env'

export interface AppOptions {
  env: Env
  /** Optional so the API (and its tests) run without Postgres. */
  db?: Pick<DbHandle, 'ping'> | undefined
  logger?: boolean
}

export async function buildApp({ env, db, logger = false }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger })

  await app.register(cors, { origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') })
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Spin Doctor API',
        description:
          'Backend for the Spin Doctor idle game (cloud save, leaderboards — see backlog).',
        version: '0.1.0',
      },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  app.get(
    '/health',
    {
      schema: {
        description: 'Liveness and database connectivity',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok', 'degraded'] },
              db: { type: 'string', enum: ['up', 'down', 'not-configured'] },
              uptime: { type: 'number' },
            },
            required: ['status', 'db', 'uptime'],
          },
        },
      },
    },
    async () => {
      const dbStatus = db ? ((await db.ping()) ? 'up' : 'down') : 'not-configured'
      return {
        status: dbStatus === 'down' ? 'degraded' : 'ok',
        db: dbStatus,
        uptime: process.uptime(),
      }
    },
  )

  return app
}
