import { serve } from '@hono/node-server'
import { AnalysisService } from './analysis-service.ts'
import { createApp } from './app.ts'
import { CacheStore } from './cache/cache-store.ts'
import { loadConfig } from './config.ts'
import { createDatabase } from './db/database.ts'
import { EspnClient } from './espn/espn-client.ts'
import { EspnFootballData } from './espn/espn-football-data.ts'
import { logger } from './logger.ts'
import { MatchdayService } from './matchday-service.ts'

const config = loadConfig()
const database = createDatabase(config.databasePath)

const football = new EspnFootballData(new EspnClient(), new CacheStore(database), {
  siteApiUrl: config.espnSiteApiUrl,
  searchApiUrl: config.espnSearchApiUrl,
})
const app = createApp({ football, analysis: new AnalysisService(football), matchday: new MatchdayService(football) })

serve({ fetch: app.fetch, port: config.port }, (info) => {
  logger.info(`Server is running on http://localhost:${info.port}`)
})
