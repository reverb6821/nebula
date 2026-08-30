import { shallowRef } from 'vue'

export function usePendingSet<T>() {
  const pending = shallowRef<Set<T>>(new Set())

  function has(id: T): boolean {
    return pending.value.has(id)
  }

  async function withPending<R>(id: T, fn: () => Promise<R>): Promise<R> {
    pending.value = new Set([...pending.value, id])
    try {
      return await fn()
    } finally {
      const next = new Set(pending.value)
      next.delete(id)
      pending.value = next
    }
  }

  return { pending, has, withPending }
}