<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Activity, Bell, Box, LayoutDashboard, Server, SlidersHorizontal } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAlertsStore } from '@/modules/alerts/store'
import { useDaemonsStore } from '@/modules/daemons/store'
import { useDockerStore } from '@/modules/docker/store'
import { formatUptime, useSystemSummary } from '@/composables/useSystemSummary'

interface NavItem {
  key: string
  to: string
  icon: Component
  badge?: { text: string; kind: 'failed' | 'muted' | 'pill'; label: string } | null
}

const { t } = useI18n()
const route = useRoute()
const { activeAlertCount } = storeToRefs(useAlertsStore())
const { stats: daemonStats } = storeToRefs(useDaemonsStore())
const { containers, runningCount, connected } = storeToRefs(useDockerStore())
const { summary } = useSystemSummary()

const appVersion = typeof window !== 'undefined' && window.NL_APPVERSION ? window.NL_APPVERSION : '0.0.1'

const groups = computed<{ key: string; items: NavItem[] }[]>(() => [
  {
    key: 'system',
    items: [
      { key: 'overview', to: '/overview', icon: LayoutDashboard },
      { key: 'processes', to: '/processes', icon: Activity },
      {
        key: 'services',
        to: '/services',
        icon: Server,
        badge: daemonStats.value.failed > 0
          ? {
              text: t('sidebar.failedCount', { n: daemonStats.value.failed }),
              kind: 'failed',
              label: t('sidebar.failedCount', { n: daemonStats.value.failed }),
            }
          : null,
      },
    ],
  },
  {
    key: 'containers',
    items: [
      {
        key: 'docker',
        to: '/docker',
        icon: Box,
        badge: connected.value && containers.value.length > 0
          ? {
              text: `${runningCount.value}/${containers.value.length}`,
              kind: 'muted',
              label: t('sidebar.runningOf', { running: runningCount.value, total: containers.value.length }),
            }
          : null,
      },
    ],
  },
  {
    key: 'nebula',
    items: [
      {
        key: 'alerts',
        to: '/alerts',
        icon: Bell,
        badge: activeAlertCount.value > 0
          ? {
              text: String(activeAlertCount.value),
              kind: 'pill',
              label: t('sidebar.alertCount', { n: activeAlertCount.value }),
            }
          : null,
      },
      { key: 'preferences', to: '/preferences', icon: SlidersHorizontal },
    ],
  },
])

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template lang="pug">
Sidebar(collapsible="offcanvas" class="border-r border-sidebar-border")
  SidebarHeader(class="px-2.5 pt-0 pb-0")
    div(class="flex min-h-14 items-center gap-2.5 pr-1 pl-1.5")
      svg(width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" class="shrink-0")
        rect(width="32" height="32" rx="9" fill="var(--primary)")
        ellipse(cx="16" cy="16" rx="11" ry="4.6" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.8" transform="rotate(-28 16 16)")
        circle(cx="16" cy="16" r="4.4" fill="#ffffff")
      div(class="flex min-w-0 flex-1 flex-col")
        span(class="text-15 font-bold") Nebula
        span(class="truncate text-xs text-muted-foreground") {{ t('sidebar.tagline') }}

  SidebarContent(class="gap-0 px-2.5")
    nav(:aria-label="t('sidebar.navigation')")
      SidebarGroup(v-for="(group, index) in groups" :key="group.key" class="p-0")
        SidebarGroupLabel(
          class="h-auto px-3 pb-1.5 text-xs font-bold text-muted-foreground"
          :class="index === 0 ? 'pt-3' : 'pt-4'"
        ) {{ t(`sidebar.groups.${group.key}`) }}
        SidebarMenu(class="gap-0.5")
          SidebarMenuItem(v-for="item in group.items" :key="item.key")
            SidebarMenuButton(
              as-child
              :is-active="isActive(item.to)"
              class="h-auto min-h-11 gap-3 rounded-[9px] px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-white data-[active=true]:bg-primary-soft data-[active=true]:font-medium data-[active=true]:text-white [&>svg]:size-[18px]"
            )
              RouterLink(:to="item.to" :aria-current="isActive(item.to) ? 'page' : undefined")
                component(:is="item.icon" aria-hidden="true")
                span(class="flex-1 truncate") {{ t(`sidebar.items.${item.key}`) }}
                span(
                  v-if="item.badge && item.badge.kind === 'failed'"
                  class="font-mono text-xs font-semibold text-destructive-text"
                  :aria-label="item.badge.label"
                ) {{ item.badge.text }}
                span(
                  v-else-if="item.badge && item.badge.kind === 'muted'"
                  class="font-mono text-xs text-muted-foreground"
                  :aria-label="item.badge.label"
                ) {{ item.badge.text }}
                span(
                  v-else-if="item.badge && item.badge.kind === 'pill'"
                  class="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-destructive px-[7px] text-xs font-bold text-white"
                  :aria-label="item.badge.label"
                ) {{ item.badge.text }}

  SidebarFooter(class="px-2.5 pt-6 pb-3.5")
    div(class="flex flex-col gap-2 rounded-lg bg-white/4 p-3.5")
      div(v-if="summary?.user" class="flex items-center gap-2")
        span(class="size-2 rounded-full bg-success" aria-hidden="true")
        span(class="font-semibold") {{ summary.user }}
        span(class="text-muted-foreground") · local
      div(class="flex flex-col gap-1 font-mono text-xs text-muted-foreground")
        span(v-if="summary") {{ t('sidebar.uptime', { uptime: formatUptime(summary.uptimeSeconds), load: summary.load1.toFixed(2) }) }}
        span Nebula Dock v{{ appVersion }}
</template>
