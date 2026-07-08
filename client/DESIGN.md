# Nebula Dock — Design System

## Design Identity

Nebula Dock is a desktop system tool: dense, precise, dark-native.
The visual language reads as **professional developer tooling** — not a marketing page.
Think: VS Code meets Linear meets a terminal. No decorative chrome.

---

## Dials (taste-skill v2)

DESIGN_VARIANCE: 5   — structured asymmetry, clean sidebar/main split, no chaos
MOTION_INTENSITY: 4  — meaningful micro-interactions only; no scroll theatrics
VISUAL_DENSITY: 8    — dense dashboard UI; data must breathe via dividers, not cards

---

## UI Style

**Primary:** Minimalism & Swiss Style + Dark Mode (OLED)
**Secondary:** Bento Box Grid for stats/container panels
**Pattern:** Real-Time Monitoring Dashboard

Best for: DevOps tools, system monitoring, terminal-adjacent UIs.
Reference feel: Docker Desktop, Raycast, Linear, VS Code sidebar.

---

## Color Palette

| Token              | Value       | Usage                              |
|--------------------|-------------|------------------------------------|
| `--bg-base`        | `#0A0A0A`   | App background (OLED black)        |
| `--bg-surface`     | `#111111`   | Panels, sidebar                    |
| `--bg-elevated`    | `#1A1A1A`   | Cards, dropdowns, modals           |
| `--bg-hover`       | `#222222`   | Row/item hover state               |
| `--border`         | `#2A2A2A`   | Dividers, borders                  |
| `--border-strong`  | `#3A3A3A`   | Active/focused borders             |
| `--text-primary`   | `#F0F0F0`   | Primary text                       |
| `--text-secondary` | `#888888`   | Labels, metadata, timestamps       |
| `--text-muted`     | `#555555`   | Disabled, placeholder              |
| `--accent`         | `#3B82F6`   | Primary action, active state       |
| `--accent-hover`   | `#2563EB`   | Accent hover                       |
| `--success`        | `#22C55E`   | Running daemon/container           |
| `--warning`        | `#F59E0B`   | Degraded, high CPU/RAM             |
| `--danger`         | `#EF4444`   | Stopped, error, destructive action |
| `--purple`         | `#A855F7`   | Ollama accent, AI-related UI       |

No gradients in UI chrome. Gradients allowed only in status indicators or sparklines.
No light mode. This app is dark-only.

---

## Typography

**Font pair:** Inter (UI) + JetBrains Mono (values, logs, stats, code)

```css
--font-ui:   'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Scale (Tailwind):**
- Page title: `text-sm font-semibold uppercase tracking-widest text-[--text-secondary]`
- Section heading: `text-base font-medium text-[--text-primary]`
- Body / labels: `text-sm text-[--text-secondary]`
- Stat values: `text-2xl font-semibold font-mono text-[--text-primary]`
- Log output: `text-xs font-mono text-[--text-secondary]`
- Timestamps: `text-xs font-mono text-[--text-muted]`

**Rules:**
- No em-dashes (—) anywhere. Use hyphen or restructure.
- No section number eyebrows (e.g. "01 · Daemons"). Banned.
- No decorative text strips or version labels in UI chrome.
- Stat numbers always in `font-mono`.

---

## Layout

**Shell:**