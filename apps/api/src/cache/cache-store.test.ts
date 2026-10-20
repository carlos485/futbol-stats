import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createTestDatabase } from '../testing/builders.ts'
import { CacheStore, NEVER_EXPIRES } from './cache-store.ts'

const TTL_MS = 1000
const numbersSchema = z.array(z.number())

function createStore() {
  const clock = { time: 1_000_000 }
  const store = new CacheStore(createTestDatabase(), () => clock.time)
  return { store, clock }
}

describe('CacheStore', () => {
  it('should_return_the_stored_value_when_entry_is_fresh', () => {
    const { store } = createStore()

    store.set('key', [1, 2, 3], TTL_MS)

    expect(store.get('key', numbersSchema)).toEqual([1, 2, 3])
  })

  it('should_return_undefined_when_key_is_unknown', () => {
    const { store } = createStore()

    expect(store.get('missing', numbersSchema)).toBeUndefined()
  })

  it('should_return_undefined_when_entry_has_expired', () => {
    const { store, clock } = createStore()
    store.set('key', [1], TTL_MS)

    clock.time += TTL_MS

    expect(store.get('key', numbersSchema)).toBeUndefined()
  })

  it('should_keep_the_entry_forever_when_it_never_expires', () => {
    const { store, clock } = createStore()
    store.set('key', [1], NEVER_EXPIRES)

    clock.time += 1000 * TTL_MS

    expect(store.get('key', numbersSchema)).toEqual([1])
  })

  it('should_overwrite_the_previous_value_when_the_key_is_set_again', () => {
    const { store } = createStore()
    store.set('key', [1], TTL_MS)

    store.set('key', [2], TTL_MS)

    expect(store.get('key', numbersSchema)).toEqual([2])
  })

  it('should_return_undefined_when_stored_value_no_longer_matches_the_schema', () => {
    const { store } = createStore()
    store.set('key', ['not a number'], TTL_MS)

    expect(store.get('key', numbersSchema)).toBeUndefined()
  })
})
