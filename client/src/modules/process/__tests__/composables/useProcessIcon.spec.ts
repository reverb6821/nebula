import { describe, it, expect } from 'vitest'
import { resolveProcessIcon } from '../../composables/useProcessIcon'
import { AppWindow, Terminal, Cpu, Server } from '@lucide/vue'
import type { Process } from '../../../../types/process'

function makeProcess(overrides: Partial<Process> = {}): Process {
    return {
        pid: 1, ppid: 0, user: 'user', pri: 20, ni: 0, status: 'R',
        cpuPercent: 0, memPercent: 0, cpuTime: '0:00', name: 'test', cmd: 'test',
        virtBytes: 0, resBytes: 0, shrBytes: 0,
        ...overrides,
    }
}

describe('resolveProcessIcon', () => {
    describe('regole brand', () => {
        it('riconosce Firefox dal nome', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'firefox', cmd: '/usr/bin/firefox' }))
            expect(icon.kind).toBe('brand')
            expect(icon.kind === 'brand' && icon.title).toBe('Firefox')
        })

        it('cerca anche in cmd, non solo in name (name è troncato a 15 char su Linux)', () => {
            // Caso reale: "nginx: worker p" è il name troncato, il cmd completo
            // porta l'informazione persa dal troncamento.
            const icon = resolveProcessIcon(makeProcess({
                name: 'nginx: worker p',
                cmd: 'nginx: worker process',
            }))
            expect(icon.kind).toBe('brand')
            expect(icon.kind === 'brand' && icon.title).toBe('NGINX')
        })

        it('Brave ha priorità su Chrome anche se entrambi i pattern potrebbero applicarsi', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'brave', cmd: '/usr/bin/brave-browser' }))
            expect(icon.kind === 'brand' && icon.title).toBe('Brave')
        })

        it('esclude Chromium dalla regola generica di Chrome (lookahead negativo)', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'chromium', cmd: '/usr/lib/chromium/chromium' }))
            expect(icon.kind === 'brand' && icon.title).toBe('Google Chrome')
        })

        it('node è un catch-all debole: matcha solo se nessuna regola più specifica ha già trovato un match prima', () => {
            // "node_modules" nel cmd non deve far scattare la regola node
            // (richiede `node` come parola isolata, non come sotto-stringa)
            const icon = resolveProcessIcon(makeProcess({
                name: 'webpack',
                cmd: '/usr/bin/node /app/node_modules/.bin/webpack',
            }))
            expect(icon.kind === 'brand' && icon.title).toBe('Node.js')
        })

        it('non scatta la regola node su "node_modules" da solo, senza un token "node" isolato', () => {
            const icon = resolveProcessIcon(makeProcess({
                name: 'somebin',
                cmd: '/opt/app/node_modules_helper',
            }))
            expect(icon.kind).toBe('fallback')
        })
    })

    describe('fallback per categoria', () => {
        it('kernel thread (tra parentesi quadre) → icona Cpu', () => {
            const icon = resolveProcessIcon(makeProcess({ name: '[kworker/0:1]', cmd: '' }))
            expect(icon).toEqual({ kind: 'fallback', component: Cpu })
        })

        it('shell interattiva → icona Terminal', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'bash', cmd: '-bash' }))
            expect(icon).toEqual({ kind: 'fallback', component: Terminal })
        })

        it('processo di root non riconosciuto → icona Server', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'systemd-journald', user: 'root', cmd: '/lib/systemd/systemd-journald' }))
            expect(icon).toEqual({ kind: 'fallback', component: Server })
        })

        it('processo utente non riconosciuto → icona AppWindow generica', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'mio-tool', user: 'user', cmd: '/home/user/mio-tool' }))
            expect(icon).toEqual({ kind: 'fallback', component: AppWindow })
        })

        it('un utente non-root ha priorità sul fallback Server anche se il nome assomiglia a un demone', () => {
            const icon = resolveProcessIcon(makeProcess({ name: 'my-daemon', user: 'user', cmd: 'my-daemon' }))
            expect(icon).toEqual({ kind: 'fallback', component: AppWindow })
        })
    })
})