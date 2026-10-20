import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { EspnError, NotFoundError } from '../errors.ts'
import { EspnClient } from './espn-client.ts'

const URL = 'https://espn.test/resource'
const schema = z.object({ value: z.number() })

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('EspnClient', () => {
  it('should_return_the_validated_payload_when_the_request_succeeds', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ value: 7, extra: 'ignored' }))

    const result = await new EspnClient(fetchFn).get(URL, schema)

    expect(result).toEqual({ value: 7 })
    expect(fetchFn).toHaveBeenCalledExactlyOnceWith(URL)
  })

  it('should_throw_not_found_when_espn_answers_404', async () => {
    const client = new EspnClient(vi.fn(async () => jsonResponse({}, 404)))

    await expect(client.get(URL, schema)).rejects.toThrow(NotFoundError)
  })

  it.each([400, 500, 503])('should_throw_an_espn_error_when_the_status_is_%i', async (status) => {
    const client = new EspnClient(vi.fn(async () => jsonResponse({}, status)))

    await expect(client.get(URL, schema)).rejects.toThrow(EspnError)
  })

  it('should_throw_an_espn_error_when_the_payload_does_not_match_the_schema', async () => {
    const client = new EspnClient(vi.fn(async () => jsonResponse({ value: 'not a number' })))

    await expect(client.get(URL, schema)).rejects.toThrow('unexpected payload')
  })

  it('should_wrap_the_network_failure_keeping_its_cause_when_espn_is_unreachable', async () => {
    const networkFailure = new TypeError('fetch failed')
    const client = new EspnClient(vi.fn(async () => Promise.reject(networkFailure)))

    const error = await client.get(URL, schema).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(EspnError)
    expect((error as EspnError).cause).toBe(networkFailure)
  })

  it('should_never_have_more_than_four_requests_in_flight_when_many_are_made_at_once', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const fetchFn = vi.fn(async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight -= 1
      return jsonResponse({ value: 1 })
    })
    const client = new EspnClient(fetchFn)

    await Promise.all(Array.from({ length: 12 }, () => client.get(URL, schema)))

    expect(maxInFlight).toBe(4)
  })
})
