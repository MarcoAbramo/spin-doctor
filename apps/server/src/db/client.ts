import { sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

export type Database = NodePgDatabase<typeof schema>

export interface DbHandle {
  db: Database
  ping(): Promise<boolean>
  close(): Promise<void>
}

export function createDb(url: string): DbHandle {
  const pool = new pg.Pool({ connectionString: url, max: 10 })
  const db = drizzle(pool, { schema })
  return {
    db,
    async ping() {
      try {
        await db.execute(sql`select 1`)
        return true
      } catch {
        return false
      }
    },
    close: () => pool.end(),
  }
}
