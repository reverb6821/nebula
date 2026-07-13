import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { defineComponent } from 'vue'
import DaemonList from '@/modules/daemons/components/DaemonList.vue'
import { useDaemonsStore } from '@/modules/daemons/store'

// Creiamo definizioni esplicite con un name associato
const DaemonItemStub = defineComponent({
    name: 'DaemonItem',
    props: ['daemon', 'pending', 'favorite'],
    template: '<div class="daemon-item-stub"><slot /></div>'
})

const DaemonCardStub = defineComponent({
    name: 'DaemonCard',
    props: ['daemon', 'pending', 'favorite'],
    template: '<div class="daemon-card-stub"><slot /></div>'
})

const ItemGroupStub = defineComponent({
    name: 'ItemGroup',
    template: '<div class="item-group-stub"><slot /></div>'
})

describe('DaemonList.vue', () => {
    let pinia: ReturnType<typeof createTestingPinia>
    let store: any

    beforeEach(() => {
        pinia = createTestingPinia({
            createSpy: vi.fn,
            stubActions: false,
        })
        store = useDaemonsStore()

        store.filteredFavorites = []
        store.filteredNonFav = []
        store.pendingNames = new Set()
        store.favoritesArray = []
        store.hasMore = false
        store.stats = { shown: 0, matching: 0 }
        store.search = ''
        store.viewMode = 'list'
    })

    const factory = () => {
        return mount(DaemonList, {
            global: {
                plugins: [pinia],
                stubs: {
                    // Registriamo gli stub mappando sia PascalCase che kebab-case per sicurezza
                    DaemonItem: DaemonItemStub,
                    'daemon-item': DaemonItemStub,
                    DaemonCard: DaemonCardStub,
                    'daemon-card': DaemonCardStub,
                    ItemGroup: ItemGroupStub,
                    'item-group': ItemGroupStub,
                    SharedButton: true,
                    SharedEmpty: true,
                    List: true,
                    LayoutGrid: true,
                    Star: true,
                    ActivitySquare: true,
                },
            },
        })
    }

    describe('Controllo barra di stato e ricerca', () => {
        it('mostra il messaggio di digitazione se i caratteri cercati sono inferiori a MIN_SEARCH_CHARS (3)', async () => {
            store.search = 'ab'
            const wrapper = factory()
            expect(wrapper.text()).toContain('Type 1 more character to search…')
        })

        it('mostra il contatore totale dei daemon quando non si digita o la ricerca supera la soglia', async () => {
            store.search = ''
            store.stats = { shown: 5, matching: 5 }
            const wrapper = factory()
            expect(wrapper.text()).toContain('5 daemons')
        })

        it('mostra la dicitura dei daemon fissati (pinned) se presenti', async () => {
            store.search = ''
            store.stats = { shown: 5, matching: 5 }
            store.filteredFavorites = [{ name: 'daemon-1' }]
            const wrapper = factory()
            expect(wrapper.text()).toContain('1 pinned')
        })
    })

    describe('Empty State', () => {
        it('mostra l\'empty state se non ci sono daemon preferiti né normali', () => {
            store.filteredFavorites = []
            store.filteredNonFav = []
            const wrapper = factory()
            const emptyComponent = wrapper.findComponent({ name: 'SharedEmpty' })
            expect(emptyComponent.exists()).toBe(true)
        })
    })

    describe('Toggle della modalità di visualizzazione (View Mode)', () => {
        it('cambia la modalità in grid o list al click sui relativi bottoni', async () => {
            const wrapper = factory()
            const buttons = wrapper.findAllComponents({ name: 'SharedButton' })

            const listButton = buttons[0]
            const gridButton = buttons[1]

            expect(listButton).toBeDefined()
            expect(gridButton).toBeDefined()

            await gridButton?.trigger('click')
            expect(store.viewMode).toBe('grid')

            await listButton?.trigger('click')
            expect(store.viewMode).toBe('list')
        })
    })

    describe('Rendering in modalità LIST', () => {
        beforeEach(() => {
            store.viewMode = 'list'
            store.filteredFavorites = [{ name: 'fav-1' }]
            store.filteredNonFav = [{ name: 'normal-1' }, { name: 'normal-2' }]
        })

        it('renderizza i componenti DaemonItem corretti per Pinned e All', () => {
            const wrapper = factory()
            const items = wrapper.findAllComponents({ name: 'DaemonItem' })

            expect(items).toHaveLength(3)
            expect(wrapper.text()).toContain('Pinned')
            expect(wrapper.text()).toContain('All')
        })

        it('inoltra correttamente gli eventi dal componente DaemonItem allo store', async () => {
            const wrapper = factory()
            const firstItem = wrapper.findComponent({ name: 'DaemonItem' })

            await firstItem.vm.$emit('start', 'fav-1')
            expect(store.start).toHaveBeenCalledWith('fav-1')

            await firstItem.vm.$emit('stop', 'fav-1')
            expect(store.stop).toHaveBeenCalledWith('fav-1')

            await firstItem.vm.$emit('restart', 'fav-1')
            expect(store.restart).toHaveBeenCalledWith('fav-1')

            await firstItem.vm.$emit('toggle-enabled', 'fav-1')
            expect(store.toggleEnabled).toHaveBeenCalledWith('fav-1')

            await firstItem.vm.$emit('toggle-favorite', 'fav-1')
            expect(store.toggleFavorite).toHaveBeenCalledWith('fav-1')
        })
    })

    describe('Rendering in modalità GRID', () => {
        beforeEach(() => {
            store.viewMode = 'grid'
            store.filteredFavorites = [{ name: 'fav-1' }]
            store.filteredNonFav = [{ name: 'normal-1' }]
        })

        it('renderizza i componenti DaemonCard invece di DaemonItem', () => {
            const wrapper = factory()

            expect(wrapper.findAllComponents({ name: 'DaemonCard' })).toHaveLength(2)
            expect(wrapper.findAllComponents({ name: 'DaemonItem' })).toHaveLength(0)
        })

        it('inoltra correttamente gli eventi dal componente DaemonCard allo store', async () => {
            const wrapper = factory()
            const firstCard = wrapper.findComponent({ name: 'DaemonCard' })

            await firstCard.vm.$emit('start', 'fav-1')
            expect(store.start).toHaveBeenCalledWith('fav-1')
        })
    })

    describe('Paginazione / Carica altro (Load more)', () => {
        it('mostra il bottone "Load more" solo se hasMore è true', async () => {
            store.filteredNonFav = [{ name: 'normal-1' }]
            store.hasMore = false
            let wrapper = factory()
            expect(wrapper.find('button.w-full').exists()).toBe(false)

            store.hasMore = true
            store.stats = { shown: 5, matching: 12 }
            wrapper = factory()

            const loadMoreBtn = wrapper.find('button.w-full')
            expect(loadMoreBtn.exists()).toBe(true)
            expect(loadMoreBtn.text()).toContain('Load more — 7 remaining')
        })

        it('chiama store.loadMore() al click del bottone', async () => {
            store.filteredNonFav = [{ name: 'normal-1' }]
            store.hasMore = true
            const wrapper = factory()

            await wrapper.find('button.w-full').trigger('click')
            expect(store.loadMore).toHaveBeenCalled()
        })
    })
})