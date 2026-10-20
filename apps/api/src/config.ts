import 'dotenv/config'
import path from 'node:path'
import { z } from 'zod'

const DEFAULT_PORT = 3000
const DEFAULT_SITE_API_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer'
const DEFAULT_SEARCH_API_URL = 'https://site.web.api.espn.com/apis/common/v3/search'
const DEFAULT_DATABASE_PATH = path.resolve(import.meta.dirname, '../data/cache.db')

const environmentSchema = z.object({
  ESPN_SITE_API_URL: z.url().default(DEFAULT_SITE_API_URL),
  ESPN_SEARCH_API_URL: z.url().default(DEFAULT_SEARCH_API_URL),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  DATABASE_PATH: z.string().min(1).default(DEFAULT_DATABASE_PATH),
})

export interface Config {
  espnSiteApiUrl: string
  espnSearchApiUrl: string
  port: number
  databasePath: string
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): Config {
  const parsed = environmentSchema.parse(environment)
  return {
    espnSiteApiUrl: parsed.ESPN_SITE_API_URL,
    espnSearchApiUrl: parsed.ESPN_SEARCH_API_URL,
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
  }
}
