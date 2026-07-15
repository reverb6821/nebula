<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"

import {
    ActivitySquare,
    Command,
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

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
        },
        {
            title: "System",
            url: "#",
            icon: ActivitySquare,
            items: [
                {
                    title: "Daemons",
                    url: "/daemons",
                },
                {
                    title: "Process",
                    url: "#",
                },
            ],
        },
        {
            title: "Docker",
            url: "/docker",
            icon: Container,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings2,
        },
    ],
}
</script>

<template>
    <Sidebar v-bind="props">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <!--
                        Rimosso as-child: il div non e' un elemento interattivo,
                        rompe la navigazione da tastiera. SidebarMenuButton rimane
                        un button nativo con il contenuto dentro.
                    -->
                    <SidebarMenuButton size="lg">
                        <div
                            class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                            aria-hidden="true"
                        >
                            <Command class="size-4" />
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
        <!-- Footer: testo grezzo stilato minimalmente per coerenza -->
        <SidebarFooter>
            <span class="px-2 py-1 text-xs text-muted-foreground select-none">
                Nebula v0.0.1
            </span>
        </SidebarFooter>
    </Sidebar>
</template>