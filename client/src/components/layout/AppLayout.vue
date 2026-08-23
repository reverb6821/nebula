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
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw } from '@lucide/vue'
import { SharedButton } from '@/components/shared'
import { usePageHeader } from "@/composables/usePageHeader"
import { storeToRefs } from 'pinia'
import Footer from "./Footer.vue"

const { title, subtitle, toolsComponent, toolsProps, onRefresh, refreshLoading } = storeToRefs(usePageHeader())
</script>

<template>
  <SidebarProvider class="h-screen overflow-hidden">
    <AppSidebar />
    <SidebarInset class="flex h-screen flex-col overflow-hidden">
      <header class="flex h-16 shrink-0 items-center gap-2">

        <!-- Sinistra: trigger + titolo + sottotitolo -->
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" aria-label="Apri/chiudi barra laterale" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" aria-hidden="true" />
          <div class="flex flex-col justify-center leading-tight">
            <span class="text-sm font-semibold tracking-tight text-foreground">{{ title }}</span>
            <span v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</span>
          </div>
        </div>

        <!-- Destra: filtri + refresh -->
        <div class="flex flex-1 items-center justify-end gap-2 px-4">
          <component :is="toolsComponent" v-if="toolsComponent" v-bind="toolsProps" />
          <SharedButton v-if="onRefresh" variant="ghost" size="icon" :disabled="refreshLoading" aria-label="Aggiorna"
            class="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground" @click="onRefresh()">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': refreshLoading }" aria-hidden="true" />
          </SharedButton>
        </div>

      </header>

      <main class="flex min-h-0 flex-1 flex-col p-4 pt-0">
        <ScrollArea class="my-2 h-full">
          <RouterView />
        </ScrollArea>
      </main>
      <Footer />
    </SidebarInset>
  </SidebarProvider>
</template>