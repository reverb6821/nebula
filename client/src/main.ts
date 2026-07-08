import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { i18n } from './i18n/index.ts'

import App from './App.vue'
import router from './router'
import { init } from "@neutralinojs/lib"

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(i18n)
app.mount('#app')

//neutralino init
init();