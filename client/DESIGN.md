---
version: "cyberpunk"
name: "nebula-dock"
description: "Dark-only interface for desktop diagnostics and system control with restrained cyberpunk accents."
colors:
  background: "#070B12"
  foreground: "#D7E2EC"
  panel: "#0E1622"
  primary: "#28D7E5"
  secondary: "#5C5BE8"
  destructive: "#F05B78"
  success: "#3FE0A0"
  warning: "#F0B35A"
  border: "#203449"
  muted: "#8EA4B8"
  focus: "#28D7E5"
typography:
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
  mono:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 0.75rem
    fontWeight: 500
  heading:
    fontFamily: Rubik Distressed, var(--font-sans)
    fontSize: 2.25rem
    fontWeight: 700
rounded:
  sm: 8px
  md: 12px
  lg: 16px
spacing:
  compact: 8px
  default: 12px
  large: 20px
---

## Visual direction

Nebula Dock uses a deep blue-black background, elevated technical panels, and restrained cyberpunk accents. The palette is intentionally quiet: the primary signal is cyan, the secondary signal is a muted violet, and red/magenta is reserved for destructive or status-critical meaning. Glow is only used in focus, active navigation, primary actions, and selected telemetry.

## Palette
- Deep blue-black background and elevated technical panels.
- Cyan primary signal and muted violet secondary signal.
- Magenta/red reserved for destructive and status meaning.
- Saturated neon accents are avoided; the interface stays technical and readable.

## Surface and depth
- Panel surfaces are dark and structured with subtle contrast rather than heavy shadow treatments.
- Glow is controlled and limited to focus rings, active navigation state, primary CTA states, and selected telemetry.
- No persistent animated scanlines, CRT distortion, or global noise.

## Accessibility requirements
- Dark theme only; no light mode is shipped.
- User-selected font family and line-height settings remain authoritative.
- Contrast remains high enough for dashboard reading and operational controls.
- Reduced-motion mode disables non-essential transitions and animations.
- High-contrast mode keeps borders and text visually reinforced without reintroducing decorative glow.

## Component behavior
- Use the semantic color tokens for surfaces, text, borders, and status states rather than raw color values.
- Keep the design restrained and utility-first so telemetry, tables, and controls remain readable at a glance.
- Favor subtle outlines and controlled signal glow instead of exaggerated effects or visual noise.