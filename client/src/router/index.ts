import { defineComponent, h } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import DaemonsView from '@/modules/daemons/views/DaemonsView.vue'
import DockerView from '@/modules/docker/views/DockerView.vue'

const Placeholder = (label: string) =>
  defineComponent({ render: () => h('div', { class: 'p-6 text-sm text-zinc-500' }, label) })

const router = createRouter({
  // WebHashHistory è più stabile con Neutralino (no server-side routing)
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/daemons' },
    { path: '/daemons',  component: DaemonsView },
    { path: '/docker',   component: DockerView },
    { path: '/ollama',   component: Placeholder('Ollama — coming soon') },
    { path: '/settings', component: Placeholder('Settings — coming soon') },
  ],
})

export default router