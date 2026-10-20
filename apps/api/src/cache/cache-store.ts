import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import type { Database } from '../db/database.ts'
import { apiCache } from '../db/schema.ts'
import { logger } from '../logger.ts'

export const NEVER_EXPIRES = null

export class CacheStore {
  constructor(
    private readonly database: Database,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns the cached value, or `undefined` when missing, expired or no longer matching the schema. */
  get<Schema extends z.ZodType>(key: string, schema: Schema): z.output<Schema> | undefined {
    const row = this.database.select().from(apiCache).where(eq(apiCache.key, key)).get()
    if (!row || (row.expiresAt !== null && row.expiresAt <= this.now())) {
      return undefined
    }

    let payload: unknown
    try {
      payload = JSON.parse(row.payload)
    } catch (error) {
      logger.warn(`[cache] discarding unreadable entry ${key}: ${String(error)}`)
      return undefined
    }

    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      logger.warn(`[cache] discarding entry ${key} that no longer matches its schema`)
      return undefined
    }
    return parsed.data
  }

  set(key: string, value: unknown, ttlMs: number | typeof NEVER_EXPIRES): void {
    const fetchedAt = this.now()
    const row = {
      key,
      payload: JSON.stringify(value),
      fetchedAt,
      expiresAt: ttlMs === NEVER_EXPIRES ? null : fetchedAt + ttlMs,
    }
    this.database
      .insert(apiCache)
      .values(row)
      .onConflictDoUpdate({ target: apiCache.key, set: row })
      .run()
  }
}
