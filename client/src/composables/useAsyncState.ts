import { ref } from 'vue'

export function useAsyncState(fallbackMessage = 'Something went wrong') {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e) {
      error.value = e instanceof Error ? e.message : fallbackMessage
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}