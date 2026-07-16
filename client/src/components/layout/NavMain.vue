<script setup lang="ts">
import { useI18n } from "vue-i18n"
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Prop opzionale con default [] — risolve il warning "Missing required prop"
withDefaults(
  defineProps<{
    items?: {
      title: string
      url: string
      icon: LucideIcon
      isActive?: boolean
      items?: {
        title: string
        url: string
      }[]
    }[]
  }>(),
  { items: () => [] }
)

const { t } = useI18n()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{ t('sidebar.navigation') }}</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible v-for="item in items" :key="item.title" as-child :default-open="item.isActive">
        <SidebarMenuItem>
          <SidebarMenuButton as-child :tooltip="item.title" class="rounded-xl">
            <RouterLink :to="item.url">
              <component :is="item.icon" aria-hidden="true" />
              <span>{{ t(`sidebar.${item.title}`) }}</span>
            </RouterLink>
          </SidebarMenuButton>
          <template v-if="item.items?.length">
            <CollapsibleTrigger as-child>
              <SidebarMenuAction class="data-[state=open]:rotate-90 rounded-xl">
                <ChevronRight aria-hidden="true" />
                <span class="sr-only">{{ t('sidebar.expand') }} {{ t(`sidebar.${item.title}`) }}</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.title">
                  <SidebarMenuSubButton as-child>
                    <RouterLink :to="subItem.url" class="rounded-xl">
                      <span>{{ t(`sidebar.${subItem.title}`) }}</span>
                    </RouterLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </template>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>