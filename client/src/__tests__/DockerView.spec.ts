import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDockerStore } from '@/modules/docker/store'
import DockerView from '@/modules/docker/views/DockerView.vue'

describe('DockerViewComponent', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()

        // Blocca gli effetti collaterali asincroni generati all'onMounted
        const store = useDockerStore()
        vi.spyOn(store, 'connect').mockImplementation(async () => { })
    })

    it('dovrebbe invocare store.connect() all\'aggancio (onMounted)', () => {
        const store = useDockerStore()
        const connectSpy = vi.spyOn(store, 'connect').mockImplementation(async () => { })

        mount(DockerView, { shallow: true })

        expect(connectSpy).toHaveBeenCalledTimes(1)
    })

    it('dovrebbe mostrare lo stato "Not connected" e l\'alert se disconnesso', () => {
        const store = useDockerStore()
        store.connected = false
        store.loading = false

        const wrapper = mount(DockerView, { shallow: true })

        expect(wrapper.text()).toContain('Not connected')

        // Con shallow: true cerchiamo per nome del componente tag/stub o selettore
        const alert = wrapper.find('shared-alert-stub') || wrapper.findComponent({ name: 'SharedAlert' })
        expect(alert.exists()).toBe(true)
    })

    it('dovrebbe mostrare i contatori corretti quando connesso', () => {
        const store = useDockerStore()
        store.connected = true

        // Popoliamo lo stato primitivo (evitando errori readonly sulle computed)
        store.containers = [
            { id: '1', shortId: '1', name: 'c1', image: 'img', status: 'running', state: 'running', ports: [], created: 0 },
            { id: '2', shortId: '2', name: 'c2', image: 'img', status: 'running', state: 'running', ports: [], created: 0 }
        ]
        store.images = [{ id: 'i1', repoTags: ['nginx'], size: 0, created: 0 }]

        const wrapper = mount(DockerView, { shallow: true })

        // Controlla la presenza dei numeri relativi ai contatori nel testo del template
        expect(wrapper.text()).toContain('2')
        expect(wrapper.text()).toContain('1')
    })

    it('dovrebbe invocare store.refresh() al click del pulsante di ricarica', async () => {
        const store = useDockerStore()
        const refreshSpy = vi.spyOn(store, 'refresh').mockImplementation(async () => { })

        const wrapper = mount(DockerView, { shallow: true })

        // Trova lo stub del bottone o un elemento cliccabile nel template primario per il refresh
        const button = wrapper.find('shared-button-stub')
        await button.trigger('click')

        expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('dovrebbe mostrare l\'alert di errore se valorizzato nello store', () => {
        const store = useDockerStore()
        store.error = 'Errore di connessione critico'

        const wrapper = mount(DockerView, { shallow: true })
        const alert = wrapper.find('shared-alert-stub')

        expect(alert.exists()).toBe(true)
    })

    it('dovrebbe mostrare il LogsViewer solo se un container è selezionato', () => {
        const store = useDockerStore()

        // 1. Popola i dati standard dello store
        store.containers = [{ id: 'c-1', shortId: 'c1', name: 'my-container', image: 'node', status: 'running', state: 'running', ports: [], created: 0 }]
        store.selectedContainerId = 'c-1'

        // 2. Forza il valore del getter computed "selectedLogs" per aggirare il readonly di TypeScript e Pinia
        Object.defineProperty(store, 'selectedLogs', {
            get: () => ['log riga 1', 'log riga 2'],
            configurable: true // Permette la sovrascrittura tra un test e l'altro
        })

        const wrapper = mount(DockerView, { shallow: true })
        const logsViewer = wrapper.find('logs-viewer-stub')

        expect(logsViewer.exists()).toBe(true)
    })

    it('dovrebbe invocare store.selectContainer(null) quando LogsViewer emette l\'evento close', async () => {
        const store = useDockerStore()
        const selectSpy = vi.spyOn(store, 'selectContainer').mockImplementation(async () => { })

        store.containers = [{ id: 'c-1', shortId: 'c1', name: 'my-container', image: 'node', status: 'running', state: 'running', ports: [], created: 0 }]
        store.selectedContainerId = 'c-1'

        const wrapper = mount(DockerView, { shallow: true })
        const logsViewer = wrapper.find('logs-viewer-stub')

        // Con lo shallow mount gli eventi dei figli si testano simulando l'emissione diretta dallo stub
        await logsViewer.trigger('close')

        expect(selectSpy).toHaveBeenCalledWith(null)
    })
})