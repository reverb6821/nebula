<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
</script>

<template>
  <TooltipProvider>
  <div class="flex h-screen w-screen overflow-hidden bg-[#0a0a0b] text-zinc-100">
    <Sidebar />

    <main class="relative flex flex-1 flex-col overflow-hidden">
      <RouterView />
    </main>
  </div>
  </TooltipProvider>
</template>