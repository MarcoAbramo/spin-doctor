import { integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/** Anonymous players (device token). Cloud save & leaderboards build on this (see backlog). */
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceTokenHash: varchar('device_token_hash', { length: 128 }).notNull().unique(),
  displayName: varchar('display_name', { length: 40 }),
  saveVersion: integer('save_version').notNull().default(1),
  save: jsonb('save'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
