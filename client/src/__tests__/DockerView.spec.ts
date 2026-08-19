import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { defineComponent } from 'vue'
import { useDockerStore } from '@/modules/docker/store'
import DockerView from '@/modules/docker/views/DockerView.vue'

// Creazione degli stub espliciti per la modalità shallow
const SharedAlertStub = defineComponent({
    name: 'SharedAlert',
    props: ['variant', 'title', 'description'],
    template: '<div class="shared-alert-stub"><h3>{{ title }}</h3><p>{{ description }}</p></div>'
})

const SharedButtonStub = defineComponent({
    name: 'SharedButton',
    props: ['variant', 'size', 'disabled'],
    template: '<button class="shared-button-stub" :disabled="disabled"><slot /></button>'
})

const LogsViewerStub = defineComponent({
    name: 'LogsViewer',
    props: ['containerName', 'lines'],
    emits: ['close'],
    template: '<div class="logs-viewer-stub"><button class="close-btn" @click="$emit(\'close\')">x</button><slot /></div>'
})

describe('DockerViewComponent', () => {
    // Configurazione minima i18n per coprire le chiavi del componente
    const i18n = createI18n({
        legacy: false,
        locale: 'it',
        messages: {
            it: {
                docker: {
                    title: 'Docker',
                    running: '{n} attivi',
                    containers: '{n} contenitori',
                    images: '{n} immagini',
                    notConnected: 'Non connesso',
                    notReachable: 'Non raggiungibile',
                    notReachableHint: 'Verifica la connessione.'
                },
                common: {
                    refresh: 'Aggiorna'
                }
            }
        }
    })

    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()

        // Blocca gli effetti collaterali asincroni generati all'onMounted
        const store = useDockerStore()
        vi.spyOn(store, 'connect').mockImplementation(async () => { })
    })

    const factory = (options = {}) => {
        return mount(DockerView, {
            shallow: true,
            global: {
                plugins: [i18n],
                stubs: {
                    SharedAlert: SharedAlertStub,
                    SharedButton: SharedButtonStub,
                    LogsViewer: LogsViewerStub,
                    DockerToolbar: true,
                    DockerList: true,
                    RefreshCw: true
                }
            },
            ...options
        })
    }

    it('dovrebbe invocare store.connect() all\'aggancio (onMounted)', () => {
        const store = useDockerStore()
        const connectSpy = vi.spyOn(store, 'connect').mockImplementation(async () => { })

        factory()

        expect(connectSpy).toHaveBeenCalledTimes(1)
    })

    it('dovrebbe mostrare lo stato "Non connesso" e l\'alert se disconnesso', () => {
        const store = useDockerStore()
        store.connected = false
        store.loading = false

        const wrapper = factory()

        expect(wrapper.text()).toContain('Non connesso')

        const alert = wrapper.findComponent(SharedAlertStub)
        expect(alert.exists()).toBe(true)
    })

    it('dovrebbe mostrare i contatori corretti quando connesso', () => {
        const store = useDockerStore()
        store.connected = true

        // Popoliamo lo stato primitivo dello store
        store.containers = [
            { id: '1', shortId: '1', name: 'c1', image: 'img', status: 'running', state: 'running', ports: [], created: 0 },
            { id: '2', shortId: '2', name: 'c2', image: 'img', status: 'running', state: 'running', ports: [], created: 0 }
        ]
        store.images = [{ id: 'i1', repoTags: ['nginx'], size: 0, created: 0 }]

        const wrapper = factory()

        expect(wrapper.text()).toContain('2 contenitori')
        expect(wrapper.text()).toContain('1 immagini')
    })

    it('dovrebbe invocare store.refresh() al click del pulsante di ricarica', async () => {
        const store = useDockerStore()
        const refreshSpy = vi.spyOn(store, 'refresh').mockImplementation(async () => { })

        const wrapper = factory()

        const button = wrapper.findComponent(SharedButtonStub)
        await button.trigger('click')

        expect(refreshSpy).toHaveBeenCalledTimes(1)
    })

    it('dovrebbe mostrare l\'alert di errore se valorizzato nello store', () => {
        const store = useDockerStore()
        store.error = 'Errore di connessione critico'
        store.connected = true // <--- AGGIUNGI QUESTO: impedisce al warning di apparire

        const wrapper = factory()
        const alert = wrapper.findComponent(SharedAlertStub)

        expect(alert.exists()).toBe(true)
        expect(alert.props('description')).toBe('Errore di connessione critico')
    })

    it('dovrebbe mostrare il LogsViewer solo se un container è selezionato', () => {
        const store = useDockerStore()

        store.containers = [{ id: 'c-1', shortId: 'c1', name: 'my-container', image: 'node', status: 'running', state: 'running', ports: [], created: 0 }]
        store.selectedContainerId = 'c-1'

        // Forza il valore del getter computed "selectedLogs" per aggirare il readonly di TypeScript/Pinia
        Object.defineProperty(store, 'selectedLogs', {
            get: () => ['log riga 1', 'log riga 2'],
            configurable: true
        })

        const wrapper = factory()
        const logsViewer = wrapper.findComponent(LogsViewerStub)

        expect(logsViewer.exists()).toBe(true)
    })

    it('dovrebbe invocare store.selectContainer(null) quando LogsViewer emette l\'evento close', async () => {
        const store = useDockerStore()
        const selectSpy = vi.spyOn(store, 'selectContainer').mockImplementation(async () => { })

        store.containers = [{ id: 'c-1', shortId: 'c1', name: 'my-container', image: 'node', status: 'running', state: 'running', ports: [], created: 0 }]
        store.selectedContainerId = 'c-1'

        const wrapper = factory()
        const logsViewer = wrapper.findComponent(LogsViewerStub)

        // Clicca sul bottone all'interno del nostro stub che emette l'evento 'close'
        await logsViewer.find('.close-btn').trigger('click')

        expect(selectSpy).toHaveBeenCalledWith(null)
    })
})