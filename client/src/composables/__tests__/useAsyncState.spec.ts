import { describe, expect, it } from 'vitest'
import { useAsyncState } from '../useAsyncState'

describe('useAsyncState', () => {
  it('returns the result and clears loading after success', async () => {
    const state = useAsyncState()
    const promise = state.run(async () => 'ok')

    expect(state.loading.value).toBe(true)
    await expect(promise).resolves.toBe('ok')
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBeNull()
  })

  it('stores Error messages and returns undefined on failure', async () => {
    const state = useAsyncState('fallback')

    await expect(state.run(async () => { throw new Error('failed') })).resolves.toBeUndefined()

    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBe('failed')
  })

  it('uses the fallback for non-Error failures', async () => {
    const state = useAsyncState('fallback')

    await state.run(async () => { throw 'failed' })

    expect(state.error.value).toBe('fallback')
  })
})
