import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/modules/dashboard/views/DashboardView.vue'
import DaemonsView from '@/modules/daemons/views/DaemonsView.vue'
import DockerView from '@/modules/docker/views/DockerView.vue'
import SettingsView from '@/modules/settings/views/SettingsView.vue'
import ProcessView from '@/modules/process/views/ProcessView.vue'
import AlertsView from '@/modules/alerts/views/AlertsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/overview' },
    { path: '/overview', name: 'overview', component: DashboardView },
    { path: '/processes', name: 'processes', component: ProcessView },
    { path: '/services', name: 'services', component: DaemonsView },
    { path: '/docker', name: 'docker', component: DockerView },
    { path: '/alerts', name: 'alerts', component: AlertsView },
    { path: '/preferences', name: 'preferences', component: SettingsView },

    // Path storici (prima del redesign): restano validi come redirect.
    { path: '/daemons', redirect: '/services' },
    { path: '/process', redirect: '/processes' },
    { path: '/settings', redirect: '/preferences' },
  ],
})

export default router
