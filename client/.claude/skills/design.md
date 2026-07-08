<!-- client/.claude/skills/design.md -->
# Skill: Nebula Dock Design System

When this skill is active, read `client/DESIGN.md` in full before writing
any component, page, or style. Treat every rule there as mandatory.

## Activation checklist

Before writing any UI code:

1. Read `client/DESIGN.md` completely
2. Declare your design read in one line:
   > "Dense dashboard panel, dark OLED, divide-y rows, mono stats, Lucide icons."
3. Confirm the dials you are targeting:
   > DESIGN_VARIANCE: 5 / MOTION_INTENSITY: 4 / VISUAL_DENSITY: 8
4. Run the Pre-Flight Checklist from DESIGN.md before outputting code

## Hard rules (summary — full detail in DESIGN.md)

- Dark only. No light backgrounds.
- Divide-y rows, not cards, for lists.
- font-mono on all stat values.
- Lucide icons, size={14} or size={16}, strokeWidth={1.5}.
- Skeleton loaders on every async fetch.
- No emojis anywhere.
- No em-dashes anywhere.
- No h-screen — use min-h-screen or overflow-hidden layout.
- CSS Grid over flexbox math.
- No entrance animations on data rows.
- Status colors from DESIGN.md token list only.

## Output rules

- Ship complete components. No placeholder comments, no "// rest follows same pattern".
- Every async component ships with its skeleton variant.
- Every empty state ships with icon + label + optional action.
- No truncated output. If the component is long, write it in full.