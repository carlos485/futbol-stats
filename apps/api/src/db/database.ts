import { mkdirSync } from 'node:fs'
import path from 'node:path'
import BetterSqlite3 from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.ts'

export const IN_MEMORY_DATABASE = ':memory:'

// The cache is disposable, so tables are created on startup instead of through drizzle-kit migrations.
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS api_cache (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    fetched_at INTEGER NOT NULL,
    expires_at INTEGER
  );
`

export type Database = BetterSQLite3Database<typeof schema>

export function createDatabase(filePath: string): Database {
  if (filePath !== IN_MEMORY_DATABASE) {
    mkdirSync(path.dirname(filePath), { recursive: true })
  }
  const sqlite = new BetterSqlite3(filePath)
  sqlite.exec(CREATE_TABLES_SQL)
  return drizzle(sqlite, { schema })
}
