<script setup lang="ts">
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
</script>

<template>
  <SidebarGroup>
    <!-- "Navigation" al posto di "Platform" — descrive il contenuto reale -->
    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible
        v-for="item in items"
        :key="item.title"
        as-child
        :default-open="item.isActive"
      >
        <SidebarMenuItem>
          <SidebarMenuButton as-child :tooltip="item.title">
            <RouterLink :to="item.url">
              <component :is="item.icon" aria-hidden="true" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </SidebarMenuButton>
          <template v-if="item.items?.length">
            <CollapsibleTrigger as-child>
              <SidebarMenuAction class="data-[state=open]:rotate-90">
                <ChevronRight aria-hidden="true" />
                <!-- sr-only descrittivo invece del generico "Toggle" -->
                <span class="sr-only">Espandi {{ item.title }}</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem
                  v-for="subItem in item.items"
                  :key="subItem.title"
                >
                  <SidebarMenuSubButton as-child>
                    <RouterLink :to="subItem.url">
                      <span>{{ subItem.title }}</span>
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