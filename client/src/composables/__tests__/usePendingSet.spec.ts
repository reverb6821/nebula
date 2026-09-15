import { describe, expect, it } from 'vitest'
import { usePendingSet } from '../usePendingSet'

describe('usePendingSet', () => {
  it('tracks an operation until it resolves', async () => {
    const pending = usePendingSet<string>()
    let resolve!: () => void
    const promise = pending.withPending('a', () => new Promise<void>((res) => { resolve = res }))

    expect(pending.has('a')).toBe(true)
    resolve()
    await promise
    expect(pending.has('a')).toBe(false)
  })

  it('removes an operation after rejection', async () => {
    const pending = usePendingSet<string>()

    await expect(pending.withPending('a', async () => { throw new Error('failed') })).rejects.toThrow('failed')

    expect(pending.has('a')).toBe(false)
  })

  it('keeps concurrent operations independent', async () => {
    const pending = usePendingSet<string>()
    let resolveA!: () => void
    let resolveB!: () => void
    const a = pending.withPending('a', () => new Promise<void>((res) => { resolveA = res }))
    const b = pending.withPending('b', () => new Promise<void>((res) => { resolveB = res }))

    resolveA()
    await a
    expect(pending.has('a')).toBe(false)
    expect(pending.has('b')).toBe(true)

    resolveB()
    await b
    expect(pending.has('b')).toBe(false)
  })
})
