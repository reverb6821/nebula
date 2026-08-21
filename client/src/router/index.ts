import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import DaemonsView from '@/modules/daemons/views/DaemonsView.vue'
import DockerView from '@/modules/docker/views/DockerView.vue'
import SettingsView from '@/modules/settings/views/SettingsView.vue'
import ProcessView from '@/modules/process/views/ProcessView.vue'

const Placeholder = (label: string) =>
  defineComponent({ render: () => h('div', { class: 'p-6 text-sm text-zinc-500' }, label) })

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/daemons',  component: DaemonsView },
    { path: '/docker',   component: DockerView },
    { path: '/process',   component: ProcessView },
    { path: '/settings', component: SettingsView },
  ],
})

export default router