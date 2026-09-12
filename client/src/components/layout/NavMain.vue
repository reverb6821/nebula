<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import type { LucideIcon } from "@lucide/vue"
import { ChevronRight } from "@lucide/vue"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: { title: string; url: string }[]
}

withDefaults(
  defineProps<{
    items?: NavItem[]
  }>(),
  { items: () => [] }
)

const { t } = useI18n()
const route = useRoute()

function isRouteActive(url: string): boolean {
  if (url === '/') return route.path === '/'
  return route.path === url || route.path.startsWith(url + '/')
}

function isGroupActive(item: NavItem): boolean {
  if (item.items?.length) return item.items.some((sub) => isRouteActive(sub.url))
  return isRouteActive(item.url)
}
</script>

<template lang="pug">
SidebarGroup
  SidebarGroupLabel {{ t('sidebar.navigation') }}
  SidebarMenu
    Collapsible(
      v-for="item in items"
      :key="item.title"
      as-child
      :default-open="isGroupActive(item)"
    )
      SidebarMenuItem
        CollapsibleTrigger(v-if="item.items?.length" as-child)
          SidebarMenuButton(:tooltip="item.title" :is-active="isGroupActive(item)" class="group rounded-md")
            component(:is="item.icon" aria-hidden="true")
            span {{ t(`sidebar.${item.title}`) }}
            ChevronRight(
              class="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90"
              aria-hidden="true"
            )

        SidebarMenuButton(v-else as-child :tooltip="item.title" :is-active="isGroupActive(item)" class="rounded-md")
          RouterLink(:to="item.url")
            component(:is="item.icon" aria-hidden="true")
            span {{ t(`sidebar.${item.title}`) }}

        CollapsibleContent(v-if="item.items?.length")
          SidebarMenuSub
            SidebarMenuSubItem(v-for="subItem in item.items" :key="subItem.title")
              SidebarMenuSubButton(as-child :is-active="isRouteActive(subItem.url)")
                RouterLink(:to="subItem.url" class="rounded-md")
                  span {{ t(`sidebar.${subItem.title}`) }}
</template>