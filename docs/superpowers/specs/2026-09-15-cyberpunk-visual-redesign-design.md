# Nebula Dock restrained cyberpunk visual redesign

## Status

Approved in chat on 2026-09-15. This document defines the design before implementation.

## Goal

Give Nebula Dock a restrained sci-fi cyberpunk visual language while preserving the
existing dark-only desktop experience, semantic Tailwind class names, application
behavior, and readability of dense operational views.

The redesign should feel like a technical control surface rather than a decorative
neon theme: deep blue-black surfaces, precise panel borders, cyan as the primary
signal, magenta as a limited secondary signal, and glow reserved for interaction
and state emphasis.

## Constraints

- Preserve existing Vue, Pinia, Tailwind v4, shadcn-vue, and Neutralino architecture.
- Preserve semantic classes such as `bg-primary`, `text-warning`, and
  `border-destructive/40`; change their token values before changing call sites.
- Keep dark-only behavior.
- Keep user-configurable font family, font size, line height, reduced-motion, and
  high-contrast behavior working.
- Do not add broad gradients, persistent animated effects, or decorative elements
  that reduce information density.
- Do not use emojis in code, comments, or documentation.
- Keep tables, logs, process views, and status labels readable at the current
  application scale.

## Design direction

### Palette and semantic tokens

The existing semantic token map remains the public styling API. The values will
move toward a restrained cyberpunk palette:

- `background`: near-black blue with a subtle cool bias.
- `card`: elevated blue-black panel.
- `popover`: slightly brighter elevated panel for dialogs and menus.
- `foreground`: cool near-white for primary content.
- `muted-foreground`: readable desaturated blue-gray for secondary content.
- `primary`: controlled cyan used for primary actions, active navigation, focus,
  and key telemetry.
- `secondary`: blue-violet or muted indigo used for secondary actions and
  supporting controls.
- `accent`: low-contrast cyan-tinted selection surface.
- `border` and `input`: cool blue-gray hairlines with enough contrast for
  component boundaries.
- `success`, `warning`, and `destructive`: remain semantically distinct and
  readable; they may receive a restrained cyberpunk tint but must not become
  indistinguishable from brand accents.
- `chart-1` through `chart-5`: ordered for telemetry readability, with cyan and
  violet leading and state colors retained for status data.
- sidebar tokens: align with the background and primary active-state treatment.

The exact hex values will be selected during implementation by checking contrast
for body text, controls, focus indicators, and status text. Token names are more
important than raw values so feature components do not depend on color literals.

### Typography and shape

- Keep Inter or the user-selected application font for body text, controls, logs,
  and tables.
- Keep the display font limited to page titles and high-impact metrics.
- Use the existing mono stack for commands, paths, identifiers, and telemetry.
- Preserve the existing radius scale, tightening visual hierarchy through border
  treatment rather than adding excessive rounding.
- Use compact labels, uppercase tracking, and technical metadata only where they
  improve scanning.

### Effects

- Use thin borders and inset highlights to establish panel hierarchy.
- Add a small reusable set of utilities for HUD-style panels, active signal
  borders, and restrained glow.
- Apply glow only to focused controls, active navigation, primary actions, and
  selected telemetry states.
- Keep animations optional and compatible with `html.reduce-motion`.
- Avoid permanent scanline overlays or animated noise in dense views.

## Implementation architecture

### Layer 1: global theme

Update `client/src/assets/main.css`:

- replace the current muted blue-gray token values with the approved restrained
  cyberpunk values;
- keep `:root` and `.dark` synchronized because the application is dark-only;
- expose any required glow, panel, or focus variables through the existing
  Tailwind theme;
- preserve font and line-height overrides from settings;
- add reduced-motion-safe utility definitions if needed;
- keep high-contrast overrides stronger than decorative styling.

### Layer 2: design documentation

Update `client/DESIGN.md` so it describes the new semantic palette, restrained
cyberpunk principles, typography limits, panel rules, glow rules, and accessibility
requirements. The document must explicitly state that neon is an accent treatment,
not a blanket color scheme.

### Layer 3: shared primitives

Normalize the shared styling surfaces before feature modules:

- `src/components/ui/button/index.ts` and `Button.vue`: primary, outline,
  secondary, ghost, destructive, focus, disabled, and loading states.
- card primitives: panel surface, border, radius, and elevation hierarchy.
- sidebar primitives: active item, hover item, separators, and collapsed states.
- shared button and alert wrappers: consistent status, focus, and loading treatment.
- related badge, input, dialog, and separator primitives where their current
  classes bypass semantic tokens.

No component API changes are planned unless a current API prevents a consistent
semantic style.

### Layer 4: shell and navigation

Update `AppLayout.vue` and `AppSidebar.vue` for the global framing:

- establish header and content separators as technical panel boundaries;
- use the primary accent only for active page state and important actions;
- make the sidebar brand and navigation read as a control console without
  increasing persistent visual noise;
- preserve current responsive behavior and navigation semantics.

### Layer 5: feature surfaces

Apply targeted class cleanup in this order:

1. dashboard cards, KPI tiles, charts, and sensor states;
2. process tables and process status controls;
3. daemon lists, status badges, filters, and actions;
4. Docker cards, logs, toolbars, and dialogs;
5. settings and appearance controls.

The work should reuse the updated primitives and tokens. Raw color literals
should only remain where a chart library or platform-specific rendering requires
them, and those literals should be centralized.

## Behavior and accessibility

- No state-management, data-fetching, IPC, or routing behavior changes.
- Focus-visible indicators must remain clearly visible against every surface.
- Text and control contrast must remain appropriate for normal and large text.
- Status meaning must not depend on color alone; existing labels and icons remain.
- Reduced-motion mode disables or minimizes glow transitions and animations.
- High-contrast mode overrides border and text colors after decorative utilities.
- User-selected font and line-height settings continue to apply globally.

## Testing and verification

The redesign is visual, but behavior-safe verification is required:

- run the existing client unit suite;
- run the client type-check;
- run the existing client build command if available;
- inspect changed shared components for semantic class and variant regressions;
- verify that reduced-motion and high-contrast selectors still win over new
  effects;
- verify that no new Neutralino access or runtime behavior is introduced.

No new test framework or visual browser dependency will be added for this pass.

## Non-goals

- No light theme.
- No redesign of data models, stores, composables, or IPC commands.
- No replacement of the existing component library.
- No mass rewrite of every Tailwind class when token or primitive changes are
  sufficient.
- No animated background, CRT distortion, or decorative scanline layer applied
  globally.
