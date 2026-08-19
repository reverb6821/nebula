import { shallowRef, ref, type Component } from 'vue'

interface HeaderState {
  title: string
  subtitle?: string
  toolsComponent: Component | null
  toolsProps?: Record<string, unknown>
  onRefresh?: (() => void) | null
  refreshLoading?: boolean
}

const title          = ref('Nebula')
const subtitle       = ref<string | undefined>(undefined)
const toolsComponent = shallowRef<Component | null>(null)
const toolsProps     = ref<Record<string, unknown>>({})
const onRefresh      = ref<(() => void) | null>(null)
const refreshLoading = ref(false)

export function usePageHeader() {
  function setHeader(state: HeaderState) {
    title.value          = state.title
    subtitle.value       = state.subtitle
    toolsComponent.value = state.toolsComponent
    toolsProps.value     = state.toolsProps ?? {}
    onRefresh.value      = state.onRefresh ?? null
    refreshLoading.value = state.refreshLoading ?? false
  }

  function clearHeader() {
    title.value          = 'Nebula'
    subtitle.value       = undefined
    toolsComponent.value = null
    toolsProps.value     = {}
    onRefresh.value      = null
    refreshLoading.value = false
  }

  return {
    title,
    subtitle,
    toolsComponent,
    toolsProps,
    onRefresh,
    refreshLoading,
    setHeader,
    clearHeader,
  }
}