import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    pingDocker,
    fetchImages,
    removeImage,
    pullImage,
    fetchContainers,
    startContainer,
    stopContainer,
    restartContainer,
    removeContainer,
    fetchLogs,
    fetchStats
} from '@/modules/docker/composables/useDockerApi'
import { runCmd } from '@/composables/useNeutralinoCmd'

vi.mock('@/composables/useNeutralinoCmd', () => ({
    runCmd: vi.fn()
}))

describe('Docker API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ─── Health ─────────────────────────────────────────────────────────────────
    describe('pingDocker', () => {
        it('restituisce true se il comando docker info ha successo', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: 'ok', stderr: '' })
            const res = await pingDocker()
            expect(runCmd).toHaveBeenCalledWith('docker info --format "ok"')
            expect(res).toBe(true)
        })

        it('restituisce false se il comando fallisce o solleva un errore', async () => {
            vi.mocked(runCmd).mockRejectedValue(new Error('Command not found'))
            const res = await pingDocker()
            expect(res).toBe(false)
        })
    })

    // ─── Images ─────────────────────────────────────────────────────────────────
    describe('fetchImages', () => {
        it('mappa correttamente l output JSON della CLI in oggetti DockerImage', async () => {
            const mockCliOutput =
                JSON.stringify({ ID: 'img1', Repository: 'nginx', Tag: 'latest', Size: '128MB', CreatedAt: '2026-01-01T12:00:00Z' }) + '\n' +
                JSON.stringify({ ID: 'img2', Repository: '<none>', Tag: '<none>', Size: '1.2GB', CreatedAt: '2026-01-02T12:00:00Z' })

            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: mockCliOutput, stderr: '' })

            const images = await fetchImages()
            expect(images).toHaveLength(2)

            // L'operatore ! garantisce a TypeScript che l'elemento a quell'indice esiste sicuramente
            expect(images[0]!).toEqual({
                id: 'img1',
                repoTags: ['nginx:latest'],
                size: 128 * 1024 ** 2,
                created: Math.floor(new Date('2026-01-01T12:00:00Z').getTime() / 1000)
            })

            expect(images[1]!.repoTags).toEqual(['<none>'])
            expect(images[1]!.size).toBe(1.2 * 1024 ** 3)
        })
    })

    describe('removeImage', () => {
        it('esegue il comando docker rmi con flag force di default', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' })
            await removeImage('img1')
            expect(runCmd).toHaveBeenCalledWith('docker rmi -f img1')
        })
    })

    // ─── Pull ───────────────────────────────────────────────────────────────────
    describe('pullImage', () => {
        it('notifica i progressi e completa la pull in caso di successo', async () => {
            vi.mocked(runCmd).mockResolvedValue({
                exitCode: 0,
                stdout: 'Using default tag: latest\nPulling from library/ubuntu',
                stderr: ''
            })

            const progressCalls: any[] = []
            const onProgress = (p: any) => progressCalls.push(p)

            await pullImage('ubuntu', onProgress)

            expect(progressCalls[0]).toEqual({ status: 'Pulling ubuntu…', done: false })
            expect(progressCalls[1]).toEqual({ status: 'Using default tag: latest', done: false })
            expect(progressCalls[3]).toEqual({ status: 'Pull complete', done: true })
        })

        it('solleva un errore e notifica il fallimento se exitCode non è 0', async () => {
            vi.mocked(runCmd).mockResolvedValue({
                exitCode: 1,
                stdout: '',
                stderr: 'Error: image not found'
            })

            const progressCalls: any[] = []
            const onProgress = (p: any) => progressCalls.push(p)

            await expect(pullImage('unknown-img', onProgress)).rejects.toThrow('Error: image not found')
            expect(progressCalls[1]).toEqual({
                status: 'Error: image not found',
                done: true,
                error: 'Error: image not found'
            })
        })
    })

    // ─── Containers ───────────────────────────────────────────────────────────────
    describe('fetchContainers', () => {
        it('mappa correttamente l output CLI in oggetti DockerContainer', async () => {
            const mockCliOutput = JSON.stringify({
                ID: 'cont123456789',
                Names: '/web-server',
                Image: 'nginx',
                Status: 'Up 2 hours',
                State: 'running',
                Ports: '80/tcp, 443/tcp',
                CreatedAt: '2026-07-10T10:00:00Z'
            })

            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: mockCliOutput, stderr: '' })

            const containers = await fetchContainers()
            expect(containers).toHaveLength(1)
            expect(containers[0]).toEqual({
                id: 'cont123456789',
                shortId: 'cont12345678', // Primi 12 caratteri
                name: 'web-server',     // Rimosso lo slash iniziale
                image: 'nginx',
                status: 'running',
                state: 'Up 2 hours',
                ports: ['80/tcp', '443/tcp'],
                created: Math.floor(new Date('2026-07-10T10:00:00Z').getTime() / 1000)
            })
        })
    })

    describe('Container Lifecycle Actions', () => {
        it('startContainer esegue docker start o lancia un errore se fallisce', async () => {
            vi.mocked(runCmd).mockResolvedValueOnce({ exitCode: 0, stdout: '', stderr: '' })
            await startContainer('c1')
            expect(runCmd).toHaveBeenCalledWith('docker start c1')

            vi.mocked(runCmd).mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'Permission denied' })
            await expect(startContainer('c1')).rejects.toThrow('Permission denied')
        })

        it('stopContainer esegue docker stop', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' })
            await stopContainer('c1')
            expect(runCmd).toHaveBeenCalledWith('docker stop c1')
        })

        it('restartContainer esegue docker restart', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' })
            await restartContainer('c1')
            expect(runCmd).toHaveBeenCalledWith('docker restart c1')
        })

        it('removeContainer esegue docker rm con il flag force', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' })
            await removeContainer('c1', true)
            expect(runCmd).toHaveBeenCalledWith('docker rm -f c1')
        })
    })

    // ─── Logs ─────────────────────────────────────────────────────────────────────
    describe('fetchLogs', () => {
        it('unisce e ordina cronologicamente le righe di stdout e stderr usando i timestamp ISO', async () => {
            vi.mocked(runCmd).mockResolvedValue({
                exitCode: 0,
                stdout: '2026-07-13T09:00:00.000Z RIGA STDOUT 1\n2026-07-13T09:10:00.000Z RIGA STDOUT 2',
                stderr: '2026-07-13T09:05:00.000Z RIGA STDERR 1'
            })

            const logs = await fetchLogs('c1', 100)

            expect(runCmd).toHaveBeenCalledWith('docker logs --tail 100 --timestamps c1')
            expect(logs).toHaveLength(3)
            // Verifica l'ordinamento corretto basato sui timestamp
            expect(logs[0]).toContain('RIGA STDOUT 1')
            expect(logs[1]).toContain('RIGA STDERR 1') // Inserito correttamente in mezzo
            expect(logs[2]).toContain('RIGA STDOUT 2')
        })
    })

    // ─── Stats ────────────────────────────────────────────────────────────────────
    describe('fetchStats', () => {
        it('mappa correttamente le stringhe e le percentuali in valori numerici di ContainerStats', async () => {
            const mockStatsOutput = JSON.stringify({
                ID: 'c1',
                CPUPerc: '12.5%',
                MemUsage: '512MiB / 4GiB',
                MemPerc: '12.8%',
                NetIO: '512kB / 100B'
            })

            vi.mocked(runCmd).mockResolvedValue({ exitCode: 0, stdout: mockStatsOutput, stderr: '' })

            const stats = await fetchStats('c1')
            expect(stats).toEqual({
                id: 'c1',
                cpuPercent: 12.5,
                memUsage: 512 * 1024 ** 2,
                memLimit: 4 * 1024 ** 3,
                memPercent: 12.8,
                netRx: 512 * 1024,
                netTx: 100
            })
        })

        it('restituisce un oggetto stats azzerato se il container non è attivo o il comando fallisce', async () => {
            vi.mocked(runCmd).mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'error' })

            const stats = await fetchStats('c1')
            expect(stats).toEqual({
                id: 'c1',
                cpuPercent: 0,
                memUsage: 0,
                memLimit: 0,
                memPercent: 0,
                netRx: 0,
                netTx: 0
            })
        })
    })
})