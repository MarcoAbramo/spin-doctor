import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createDb } from './db/client'
import { readEnv } from './env'

const env = readEnv()
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required for migrations')
const handle = createDb(env.DATABASE_URL)
// dist/migrate.js → ../drizzle ; src/migrate.ts → ../drizzle
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))
await migrate(handle.db, { migrationsFolder })
console.log('Migrations applied')
await handle.close()
