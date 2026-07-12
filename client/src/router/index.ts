import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import DaemonsView from '@/modules/daemons/views/DaemonsView.vue'
import DockerView from '@/modules/docker/views/DockerView.vue'

const Placeholder = (label: string) =>
  defineComponent({ render: () => h('div', { class: 'p-6 text-sm text-zinc-500' }, label) })

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Placeholder('Dashboard — coming soon') },
    { path: '/daemons',  component: DaemonsView },
    { path: '/docker',   component: DockerView },
    { path: '/settings', component: Placeholder('Settings — coming soon') },
  ],
})

export default router