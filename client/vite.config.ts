import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    // Svuota dist/ a ogni build: `neu build --embed-resources` incorpora
    // l'intera cartella, quindi bundle e asset vecchi finirebbero nel binario.
    // La libreria Neutralino arriva dal pacchetto npm, non da un neutralino.js.
    emptyOutDir: true,
  },
    server: {
    port: 5173,
    strictPort: true,
  },
})
