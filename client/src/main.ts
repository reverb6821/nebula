import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { i18n } from './i18n/index.ts'
import { init, events, app as neuApp } from '@neutralinojs/lib'
import { useSettingsStore, applyToDOM } from './modules/settings/store'
import { useProcessesStore } from '@/modules/process/store.ts'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PiniaColada, {})

app.use(router)
app.use(i18n)

app.mount('#app')

const settings = useSettingsStore()
applyToDOM(settings.state)

init()

events.on('windowClose', async () => {
  const processesStore = useProcessesStore()
  await processesStore.stopAutoRefresh()
  neuApp.exit()
})