import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const apiCache = sqliteTable('api_cache', {
  key: text('key').primaryKey(),
  payload: text('payload').notNull(),
  fetchedAt: integer('fetched_at').notNull(),
  /** `null` means the entry never expires. */
  expiresAt: integer('expires_at'),
})
