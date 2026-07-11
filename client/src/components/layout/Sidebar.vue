<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ActivitySquare,
  Container,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Settings,
} from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const { sidebarCollapsed } = storeToRefs(appStore)

interface NavItem {
  label: string
  path: string
  icon: typeof ActivitySquare
}

interface NavGroup {
  heading: string
  items: NavItem[]
}

const groups: NavGroup[] = [

  {
    heading: 'Dashboard',
    items: [
      { label: 'Dashboard', path: '/', icon: ActivitySquare },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Daemons', path: '/daemons', icon: ActivitySquare },
    ],
  },
  {
    heading: 'Containers',
    items: [
      { label: 'Docker', path: '/docker', icon: Container },
    ],
  },
]

const bottomItems: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: Settings },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    :class="cn(
      'relative flex h-full flex-col border-r border-zinc-800 bg-[#111113] transition-all duration-200',
      sidebarCollapsed ? 'w-[56px]' : 'w-[220px]',
    )"
  >
    <!-- Logo -->
    <div
      :class="cn(
        'flex items-center gap-3 border-b border-zinc-800 px-4 py-4',
        sidebarCollapsed && 'justify-center px-0',
      )"
    >
      <!-- Nebula SVG mark -->
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="shrink-0"
      >
        <circle cx="12" cy="12" r="10" fill="url(#nebula-outer)" opacity="0.15" />
        <circle cx="12" cy="12" r="6"  fill="url(#nebula-mid)"   opacity="0.3"  />
        <circle cx="12" cy="12" r="3"  fill="url(#nebula-core)"  opacity="0.9"  />
        <defs>
          <radialGradient id="nebula-outer" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#818cf8" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="nebula-mid" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#a5b4fc" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.2" />
          </radialGradient>
          <radialGradient id="nebula-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="#e0e7ff" />
            <stop offset="100%" stop-color="#818cf8" />
          </radialGradient>
        </defs>
      </svg>

      <span
        v-if="!sidebarCollapsed"
        class="text-sm font-semibold tracking-tight text-zinc-100"
      >
        Nebula Dock
      </span>
    </div>

    <!-- Nav groups -->
    <nav class="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
      <div v-for="group in groups" :key="group.heading">
        <p
          v-if="!sidebarCollapsed"
          class="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-600"
        >
          {{ group.heading }}
        </p>
        <div v-else class="mb-1 mx-auto h-px w-8 bg-zinc-800" />

        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          :class="cn(
            'group flex items-center gap-3 px-4 py-2 text-sm transition-colors',
            sidebarCollapsed && 'justify-center px-0',
            isActive(item.path)
              ? 'text-zinc-100 bg-zinc-800/80'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40',
          )"
        >
          <!-- Active indicator bar -->
          <span
            v-if="isActive(item.path)"
            class="absolute left-0 h-6 w-0.5 rounded-r bg-indigo-500"
          />

          <component
            :is="item.icon"
            :class="cn(
              'h-4 w-4 shrink-0',
              isActive(item.path) ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400',
            )"
          />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- Bottom items -->
    <div class="border-t border-zinc-800 py-3">
      <RouterLink
        v-for="item in bottomItems"
        :key="item.path"
        :to="item.path"
        :class="cn(
          'group flex items-center gap-3 px-4 py-2 text-sm transition-colors',
          sidebarCollapsed && 'justify-center px-0',
          isActive(item.path)
            ? 'text-zinc-100 bg-zinc-800/80'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40',
        )"
      >
        <component
          :is="item.icon"
          class="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-400"
        />
        <span v-if="!sidebarCollapsed">{{ item.label }}</span>
      </RouterLink>
    </div>

    <!-- Collapse toggle -->
    <button
      class="absolute -right-3 top-[52px] flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
      @click="appStore.toggleSidebar()"
    >
      <ChevronLeft v-if="!sidebarCollapsed" class="h-3 w-3" />
      <ChevronRight v-else class="h-3 w-3" />
    </button>
  </aside>
</template>