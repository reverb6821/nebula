import type { Component } from 'vue'
import type { Process } from '@/types/process'
import {
    siBrave, siGooglechrome, siFirefox, siOpera, siSlackware,
    siGnome, siGnometerminal,
    siVscodium, siDocker, siNodedotjs, siPython, siGit, siPostgresql,
    siMysql, siMariadb, siRedis, siNginx, siDiscord, siSpotify,
    siTelegram, siSteam, siVlcmediaplayer, siZoom, siThunderbird,
    siPnpm, siAlacritty
} from 'simple-icons'
import { AppWindow, Terminal, Cpu, Server } from '@lucide/vue'
// ─── Icona per processo ─────────────────────────────────────────────────────
// Non esiste un'API cross-platform per "icona dell'eseguibile di questo PID"
// (Windows la estrae dall'exe, macOS dal bundle .app, Linux andrebbe
// incrociata coi .desktop file e l'icon theme — tre percorsi completamente
// diversi). Approccio pragmatico: mappa curata per le app riconoscibili
// (via simple-icons, solo dati SVG, offline) + fallback generico per
// categoria per tutto il resto.

export interface BrandIcon {
    kind: 'brand'
    path: string
    color: string // hex, senza #
    title: string
}

export interface FallbackIcon {
    kind: 'fallback'
    component: Component
}

interface BrandRule {
    test: RegExp
    icon: { path: string; hex: string; title: string }
}

// L'ordine conta: le regole più specifiche vanno prima di quelle generiche
// (es. Brave prima di Chromium, dato che Brave è basato su Chromium).
const BRAND_RULES: BrandRule[] = [
    { test: /brave/i, icon: siBrave },
    { test: /firefox/i, icon: siFirefox },
    // { test: /msedge|microsoft-edge/i, icon: siMicrosoftedge },
    { test: /\bopera\b/i, icon: siOpera },
    { test: /google-chrome|chrome(?!ium)/i, icon: siGooglechrome },
    { test: /chromium/i, icon: siGooglechrome },
    // { test: /code-oss|\bcode\b/i, icon: siVisualstudiocode },
    { test: /codium|\bcode\b/i, icon: siVscodium },
    { test: /pnpm/i, icon: siPnpm },
    { test: /gnome/i, icon: siGnome },
    { test: /alacritty/i, icon: siAlacritty },
    { test: /gnometerminal|terminal/i, icon: siGnometerminal },

    { test: /dockerd|docker-desktop/i, icon: siDocker },
    { test: /postgres/i, icon: siPostgresql },
    { test: /mariadbd/i, icon: siMariadb },
    { test: /mysqld/i, icon: siMysql },
    { test: /redis-server/i, icon: siRedis },
    { test: /nginx/i, icon: siNginx },
    { test: /slack/i, icon: siSlackware },
    { test: /discord/i, icon: siDiscord },
    { test: /spotify/i, icon: siSpotify },
    { test: /telegram/i, icon: siTelegram },
    { test: /steam/i, icon: siSteam },
    { test: /vlc/i, icon: siVlcmediaplayer },
    { test: /zoom/i, icon: siZoom },
    { test: /thunderbird/i, icon: siThunderbird },
    { test: /python[0-9.]*$/i, icon: siPython },
    { test: /^git$/i, icon: siGit },
    // node è volutamente l'ultima regola brand: moltissime app Electron
    // includono "node" nel proprio cmd, quindi va tenuta come catch-all debole.
    { test: /(^|\/)node(\s|$)/i, icon: siNodedotjs },
]

const SHELL_RE = /^(bash|zsh|fish|sh|dash|tmux)$/i
const KERNEL_RE = /^\[.*\]$/ // es. "[kworker/0:1]", "[ksoftirqd/0]"

export function resolveProcessIcon(process: Process): BrandIcon | FallbackIcon {
    // process.name (comm) su Linux è troncato a 15 caratteri: si cerca sempre
    // anche in process.cmd, che riporta la command line intera e non ha
    // questo limite.
    const haystack = `${process.name} ${process.cmd}`.toLowerCase()

    for (const rule of BRAND_RULES) {
        if (rule.test.test(haystack)) {
            return { kind: 'brand', path: rule.icon.path, color: rule.icon.hex, title: rule.icon.title }
        }
    }

    if (KERNEL_RE.test(process.name)) return { kind: 'fallback', component: Cpu }
    if (SHELL_RE.test(process.name)) return { kind: 'fallback', component: Terminal }
    if (process.user === 'root') return { kind: 'fallback', component: Server }

    return { kind: 'fallback', component: AppWindow }
}