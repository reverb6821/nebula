# Feature & Refactoring Planner Skill

This skill defines the planning standards, architectural review process, and step-by-step implementation workflows for AI agents executing complex features or refactoring tasks on the **Vue 3 / Neutralinojs Desktop Client**.

---

## When to Use

Reference this skill during:
- New feature design and implementation planning
- Architectural changes, state refactoring, or IPC contract updates
- Complex module restructuring or multi-file refactoring
- Risk analysis and edge-case mitigation prior to code generation

---

## Planning Process

```
┌──────────────────────────────┐
│  1. Requirements Analysis    │ ──► Success criteria, constraints & edge cases
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  2. Architecture Review      │ ──► File paths, shared composables & store impacts
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  3. Phased Step Breakdown    │ ──► Incremental steps, dependencies & risk levels
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  4. Testing Strategy & Plan  │ ──► Vitest specs, IPC mocks & Playwright flows
└──────────────────────────────┘
```

---

## Plan Template

When generating an implementation plan, adhere strictly to the structure below:

```markdown
# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary of the feature or refactoring goal]

## Requirements & Scope
- [Requirement 1]
- [Requirement 2]

## Architecture Changes
- `src/modules/[module]/[file].ts`: [Description of change]
- `src/composables/useNeutralinoCmd.ts`: [IPC update if needed]

## Implementation Steps

### Phase 1: Core IPC & Domain Types
1. **[Step Name]** (File: `src/types/[file].ts`)
   - Action: Define TypeScript interfaces and IPC response shapes.
   - Dependencies: None
   - Risk: Low

2. **[Step Name]** (File: `src/modules/[module]/composables/use[Action].ts`)
   - Action: Implement OS command execution with cross-platform checks (Windows/Linux).
   - Dependencies: Step 1
   - Risk: Medium (Requires OS escalation handling)

### Phase 2: State Management & UI Layer
1. **[Step Name]** (File: `src/modules/[module]/store.ts`)
   - Action: Implement Pinia setup store with refDebounced filter controls.
   - Dependencies: Phase 1
   - Risk: Low

2. **[Step Name]** (File: `src/modules/[module]/components/[Component].vue`)
   - Action: Build UI using shadcn-vue primitives and storeToRefs reactivity.
   - Dependencies: Step 1
   - Risk: Low

## Testing Strategy
- Unit Tests: Vitest coverage for `use[Action].ts` and Pinia store mutations.
- E2E Tests: Playwright flows verifying user interactions and UI feedback.

## Risks & Mitigations
- **Risk**: Neutralino execution fails in browser dev mode.
  - Mitigation: Ensure `window.NL_PORT` is safely checked and fallback mock data is returned.

## Success Criteria
- [ ] Feature fully functional on both Windows (PowerShell) and Linux (`systemctl`).
- [ ] No direct `console.log` statements remain in non-debug code.
- [ ] All unit tests pass with clean TypeScript type checks.
```

---

## Critical Rules

1. **Specific File Locations**: Always provide absolute relative paths starting from `src/`.
2. **IPC Verification**: Verify if OS calls require administrative privileges (`pkexec` or elevated PowerShell) during the planning stage.
3. **Reactivity Safety**: Ensure store destructuring plans explicitly specify `storeToRefs` to prevent loss of reactivity.
4. **No Emojis**: Keep plans, code comments, and documentation clean and emoji-free.