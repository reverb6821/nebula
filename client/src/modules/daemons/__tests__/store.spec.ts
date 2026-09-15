import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDaemonsStore } from '../store'
import type { Daemon } from '@/types/daemon'
import { listDaemons, startDaemon, stopDaemon } from '../composables/useDaemonAction'

vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn().mockRejectedValue(new Error('storage unavailable')),
    setData: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../composables/useDaemonAction', () => ({
  listDaemons: vi.fn(),
  startDaemon: vi.fn(),
  stopDaemon: vi.fn(),
  enableDaemon: vi.fn(),
  disableDaemon: vi.fn(),
  restartDaemon: vi.fn(),
}))

const mockedListDaemons = vi.mocked(listDaemons)
const mockedStartDaemon = vi.mocked(startDaemon)
const mockedStopDaemon = vi.mocked(stopDaemon)

function makeDaemon(index: number, overrides: Partial<Daemon> = {}): Daemon {
  return {
    name: `daemon-${index}`,
    description: `Description ${index}`,
    status: 'inactive',
    enabled: 'disabled',
    ...overrides,
  }
}

describe('useDaemonsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockedListDaemons.mockResolvedValue([])
    mockedStartDaemon.mockResolvedValue(undefined)
    mockedStopDaemon.mockResolvedValue(undefined)
  })

  it('filters by search, status, and enabled state', async () => {
    const store = useDaemonsStore()
    const daemons = [
      makeDaemon(1, { name: 'nginx', description: 'Web server', status: 'active', enabled: 'enabled' }),
      makeDaemon(2, { name: 'cron', description: 'Scheduler', status: 'inactive', enabled: 'static' }),
    ]
    mockedListDaemons.mockResolvedValue(daemons)

    await store.fetch()
    store.search = 'nginx'
    await new Promise((resolve) => setTimeout(resolve, 350))
    expect(store.filtered).toEqual([daemons[0]])

    store.search = ''
    await new Promise((resolve) => setTimeout(resolve, 350))
    store.toggleStatusFilter('inactive')
    store.toggleEnabledFilter('static')
    expect(store.filtered).toEqual([daemons[1]])
  })

  it('keeps favorites first and outside pagination', async () => {
    const store = useDaemonsStore()
    const daemons = Array.from({ length: 13 }, (_, index) => makeDaemon(index))
    mockedListDaemons.mockResolvedValue(daemons)

    await store.fetch()
    store.toggleFavorite('daemon-12')

    expect(store.filteredFavorites.map((daemon) => daemon.name)).toEqual(['daemon-12'])
    expect(store.filteredNonFav).toHaveLength(12)
    expect(store.filtered[0]?.name).toBe('daemon-12')
    expect(store.hasMore).toBe(false)
  })

  it('updates statistics and paginates non-favorites', async () => {
    const store = useDaemonsStore()
    mockedListDaemons.mockResolvedValue([
      makeDaemon(1, { status: 'active' }),
      makeDaemon(2, { status: 'failed' }),
      ...Array.from({ length: 11 }, (_, index) => makeDaemon(index + 3)),
    ])

    await store.fetch()

    expect(store.stats).toEqual({ active: 1, failed: 1, total: 13, shown: 12, matching: 13 })
    expect(store.hasMore).toBe(true)
    store.loadMore()
    expect(store.filtered).toHaveLength(13)
    expect(store.hasMore).toBe(false)
  })

  it('does not toggle static daemons', async () => {
    const store = useDaemonsStore()
    const daemon = makeDaemon(1, { enabled: 'static' })
    mockedListDaemons.mockResolvedValue([daemon])

    await store.fetch()
    await store.toggleEnabled('daemon-1')

    expect(store.daemons[0]).toEqual(daemon)
  })

  it('patches daemon state only after a successful action', async () => {
    const store = useDaemonsStore()
    const daemon = makeDaemon(1)
    mockedListDaemons.mockResolvedValue([daemon])

    await store.fetch()
    await store.start('daemon-1')
    expect(store.daemons[0]?.status).toBe('active')

    mockedStartDaemon.mockRejectedValueOnce(new Error('permission denied'))
    await store.start('daemon-1')
    expect(store.daemons[0]?.status).toBe('active')
    expect(store.error).toBe('permission denied')

    await store.stop('daemon-1')
    expect(store.daemons[0]?.status).toBe('inactive')
    expect(mockedStopDaemon).toHaveBeenCalledWith('daemon-1')
  })
})
