import { buildApp } from './app'
import { createDb } from './db/client'
import { readEnv } from './env'

const env = readEnv()
const db = env.DATABASE_URL ? createDb(env.DATABASE_URL) : undefined
const app = await buildApp({ env, db, logger: true })

const shutdown = async () => {
  await app.close()
  await db?.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

await app.listen({ host: env.HOST, port: env.PORT })
