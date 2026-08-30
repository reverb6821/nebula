<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import { useI18n } from "vue-i18n";
import {
    ActivitySquare,
    Container,
    Settings2,
    SquareTerminal,
} from "@lucide/vue"

import NavMain from "./NavMain.vue"
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

// Prima "DASHBOARD" aveva isActive: true hardcoded — un flag statico
// che non riflette mai la rotta corrente, solo lo stato al primo
// render. NavMain.vue ora calcola l'evidenziazione da useRoute(), quindi
// questo campo non serve più a nulla: era codice morto (peggio,
// fuorviante, sembrava fare qualcosa).
const data = {
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
            title: "SETTINGS",
            url: "/settings",
            icon: Settings2,
        },
    ],
}
</script>

<template>
    <Sidebar v-bind="props" class="h-full">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg">
                        <!--
                          rounded-md (12px, "elemento") invece di rounded-lg:
                          con i nuovi token del tema (main.css) rounded-lg
                          ora vale 16px, troppo su un badge di 32px.
                          Logo puramente decorativo: alt="" + aria-hidden,
                          il nome "Nebula" accanto porta già il significato.
                        -->
                        <div
                            class="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md text-sidebar-primary-foreground"
                            aria-hidden="true"
                        >
                            <img src="../../assets/logo.png" alt="" class="h-full w-full object-cover" />
                        </div>
                        <div class="grid flex-1 text-left text-sm leading-tight">
                            <span class="truncate font-medium">Nebula</span>
                            <span class="truncate text-xs">System and Docker manager</span>
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
            <NavMain :items="data.navMain" />
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
    </Sidebar>
</template>