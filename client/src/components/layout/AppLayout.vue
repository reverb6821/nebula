<script lang="ts">
export const description = "An inset sidebar with secondary navigation."
export const iframeHeight = "800px"
</script>

<script setup lang="ts">
import AppSidebar from "./AppSidebar.vue"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { RefreshCw } from '@lucide/vue'
import { SharedButton } from '@/components/shared'
import { usePageHeader } from "@/composables/usePageHeader"

const { title, subtitle, toolsComponent, toolsProps, onRefresh, refreshLoading } = usePageHeader()
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b border-white/[0.06]">

        <!-- Sinistra: trigger + titolo + sottotitolo -->
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger
            class="-ml-1"
            aria-label="Apri/chiudi barra laterale"
          />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
            aria-hidden="true"
          />
          <div class="flex flex-col justify-center leading-tight">
            <span class="text-sm font-semibold tracking-tight text-zinc-100">{{ title }}</span>
            <span v-if="subtitle" class="text-xs text-zinc-500">{{ subtitle }}</span>
          </div>
        </div>

        <!-- Destra: filtri + refresh -->
        <div class="flex flex-1 items-center justify-end gap-2 px-4">
          <component :is="toolsComponent" v-if="toolsComponent" v-bind="toolsProps" />
          <SharedButton
            v-if="onRefresh"
            variant="ghost"
            size="icon"
            :disabled="refreshLoading"
            aria-label="Aggiorna"
            class="h-8 w-8 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
            @click="onRefresh()"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': refreshLoading }" />
          </SharedButton>
        </div>

      </header>

      <main class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>