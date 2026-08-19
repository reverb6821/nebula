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
import Badge from "../ui/badge/Badge.vue";

const props = withDefaults(defineProps<SidebarProps>(), {
    variant: "inset",
})

const { t } = useI18n()

const data = {
    navMain: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
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
                        <div class="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground"
                            aria-hidden="true">
                            <img src="../../assets/logo.png" </div>
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