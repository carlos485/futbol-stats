import pLimit from 'p-limit'
import type { z } from 'zod'
import { EspnError, NotFoundError } from '../errors.ts'
import { logger } from '../logger.ts'

// ESPN documents no rate limit for this API, so requests are kept to a polite number in flight.
const MAX_CONCURRENT_REQUESTS = 4
const HTTP_NOT_FOUND = 404

export interface EspnSource {
  get<Schema extends z.ZodType>(url: string, schema: Schema): Promise<z.output<Schema>>
}

export class EspnClient implements EspnSource {
  private readonly queue = pLimit(MAX_CONCURRENT_REQUESTS)

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  get<Schema extends z.ZodType>(url: string, schema: Schema): Promise<z.output<Schema>> {
    return this.queue(async () => {
      const response = await this.request(url)
      logger.info(`[espn] GET ${url} -> ${response.status}`)
      if (response.status === HTTP_NOT_FOUND) {
        throw new NotFoundError(`ESPN has no data for ${url}`)
      }
      if (!response.ok) {
        throw new EspnError(`ESPN responded with HTTP ${response.status} for ${url}`)
      }
      const parsed = schema.safeParse(await response.json())
      if (!parsed.success) {
        throw new EspnError(`ESPN returned an unexpected payload for ${url}`, { cause: parsed.error })
      }
      return parsed.data
    })
  }

  private async request(url: string): Promise<Response> {
    try {
      return await this.fetchFn(url)
    } catch (error) {
      throw new EspnError(`Could not reach ESPN (${url})`, { cause: error })
    }
  }
}
