<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from "vue-i18n";
import {
    ActivitySquare,
    Container,
    BellRing,
    Settings2,
    SquareTerminal,
} from "@lucide/vue"

import NavMain from "./NavMain.vue"
import { useAlertsStore } from '@/modules/alerts/store'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const props = withDefaults(defineProps<SidebarProps>(), {
    variant: "inset",
})

const { t } = useI18n()
const { triggeredEvents } = storeToRefs(useAlertsStore())

// Prima "DASHBOARD" aveva isActive: true hardcoded — un flag statico
// che non riflette mai la rotta corrente, solo lo stato al primo
// render. NavMain.vue ora calcola l'evidenziazione da useRoute(), quindi
// questo campo non serve più a nulla: era codice morto (peggio,
// fuorviante, sembrava fare qualcosa).
const data = computed(() => ({
    navMain: [
        {
            title: "DASHBOARD",
            url: "/",
            icon: SquareTerminal,
        },
        {
            title: "SYSTEM",
            url: "#",
            icon: ActivitySquare,
            items: [
                {
                    title: "SYSTEM_DAEMONS",
                    url: "/daemons",
                },
                {
                    title: "SYSTEM_PROCESS",
                    url: "/process",
                },
            ],
        },
        {
            title: "DOCKER",
            url: "/docker",
            icon: Container,
        },
        {
            title: "ALERTS",
            url: "/alerts",
            icon: BellRing,
            badge: triggeredEvents.value.length,
        },
        {
            title: "SETTINGS",
            url: "/settings",
            icon: Settings2,
        },
    ],
}))
</script>

<template lang="pug">
Sidebar(v-bind="props" class="h-full border-r border-primary/15 bg-sidebar")
  SidebarHeader
    SidebarMenu
      SidebarMenuItem
        SidebarMenuButton(size="lg")
          div(
            class="cyber-signal flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md text-sidebar-primary-foreground"
            aria-hidden="true"
          )
            img(src="../../assets/logo.png" alt="Nebula logo" class="h-full w-full object-cover")
          div(class="grid flex-1 text-left text-sm leading-tight")
            span(class="truncate font-heading font-medium tracking-wide text-sidebar-foreground") NEBULA
            span(class="truncate cyber-label") System and Docker manager
  SidebarContent
    NavMain(:items="data.navMain")
  SidebarFooter
</template>