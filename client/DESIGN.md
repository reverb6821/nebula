# Nebula Dock — Design System

## Design Identity

Nebula Dock is a desktop system tool: dense, precise, dark-native.
The visual language reads as **professional developer tooling** — not a marketing page.
Think: VS Code meets Linear meets a terminal. No decorative chrome.

---

## Design Dials

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
- No section number eyebrows (e.g. "01 - Daemons"). Banned.
- No decorative text strips or version labels in UI chrome.
- Stat numbers always in `font-mono`.

---

## Layout

**Shell:**
```
+--------------------------------------------------+
|  Sidebar (240px fixed) |  Main Content (flex-1)  |
|  - Nav items           |  - Feature panels       |
|  - Status indicators   |  - Data tables          |
|                        |  - Log streams          |
+--------------------------------------------------+
```

- Sidebar: `w-60 border-r border-[--border] bg-[--bg-surface]`
- Main: `flex-1 overflow-auto bg-[--bg-base]`
- No top navbar. Navigation lives in the sidebar only.
- Page max-width: unconstrained (fills window). Use `px-6 py-4` for content padding.

**Grid rules:**
- Use CSS Grid for stat panels: `grid grid-cols-2 lg:grid-cols-4 gap-3`
- Always `grid-flow-dense` on bento grids. No empty cells.
- For data rows: `divide-y divide-[--border]` over cards.
- Cards only when elevation communicates hierarchy (modals, dropdowns, dialogs).

---

## Component Patterns

### Status Badge
```tsx
// Running: green, Stopped: red, Unknown: muted
<span className="inline-flex items-center gap-1.5 text-xs font-mono">
  <span className="w-1.5 h-1.5 rounded-full bg-[--success]" />
  running
</span>
```

### Stat Card (Docker / system metrics)
```tsx
<div className="p-4 border border-[--border] rounded-lg bg-[--bg-elevated]">
  <p className="text-xs text-[--text-secondary] uppercase tracking-wider">CPU</p>
  <p className="text-2xl font-mono font-semibold text-[--text-primary] mt-1">12.4%</p>
</div>
```

### Table Row (Daemon / Container list)
```tsx
// Use divide-y, not individual cards per row
<div className="divide-y divide-[--border]">
  <div className="flex items-center gap-4 px-4 py-3 hover:bg-[--bg-hover] transition-colors duration-150">
    ...
  </div>
</div>
```

### Log Stream
```tsx
<pre className="font-mono text-xs text-[--text-secondary] bg-[--bg-surface] p-4 rounded-lg overflow-auto max-h-96 leading-relaxed">
  {logs}
</pre>
```

---

## Motion Rules

- Hover transitions: `transition-colors duration-150` on rows, `transition-all duration-200` on buttons.
- No scroll-driven animations. No entrance animations on data rows.
- Skeleton loaders on all async data — match layout dimensions exactly.
- Empty states: composed, with icon + label + optional action. Never a bare empty `<div>`.
- Loading spinners: only for full-panel blocking loads. Otherwise use skeleton.
- No GSAP. Motion.js only for panel transitions or modal enter/exit.

---

## Icons

Use **Lucide React** (already installed). Stroke width: `1.5` globally.
No emojis anywhere — not in UI, not in alt text, not in log output labels.

```tsx
import { Play, Square, Trash2, RefreshCw, Terminal } from 'lucide-react'
// Always: <Play size={14} strokeWidth={1.5} />
```

---

## Anti-Patterns (BANNED)

- Centered hero sections or marketing-page layouts
- Rounded cards everywhere (`rounded-2xl` on data rows)
- Gradient backgrounds in app chrome
- Color-coded sidebar icons without text labels
- Generic circular spinner as primary loading state
- Section number labels ("01 - Daemons", "02 - Docker")
- Light backgrounds (`bg-white`, `bg-gray-50`) anywhere
- `h-screen` — use `min-h-screen` or fixed layout with `overflow-hidden`
- `calc()` flexbox math — use CSS Grid
- Cards with drop shadows on data list items
- Emojis as status icons

---

## Pre-Flight Checklist

Before shipping any component:

- [ ] No emojis in markup or alt text
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover state defined with `transition-colors duration-150`
- [ ] Skeleton loader present for every async fetch
- [ ] Empty state composed (icon + message), not blank
- [ ] All stat values in `font-mono`
- [ ] No `h-screen` — layout uses proper flex/grid containment
- [ ] Status colors from token list only (no arbitrary green/red)
- [ ] Lucide icons at `size={14}` or `size={16}`, `strokeWidth={1.5}`
- [ ] No em-dashes anywhere
- [ ] Responsive: sidebar collapses at `md` breakpoint