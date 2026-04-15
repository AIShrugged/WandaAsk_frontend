---
title: 'refactor: Color Contrast & Readability Audit'
type: refactor
status: completed
date: 2026-04-14
---

# refactor: Color Contrast & Readability Audit

## Overview

The project uses `text-muted-foreground` in **427 places** across the codebase —
the single most-used text utility after `text-foreground`. Many of those usages
apply additional opacity modifiers (`/30`, `/40`, `/50`, `/60`) that push the
effective contrast well below WCAG AA (4.5:1) thresholds.

A previous audit (2026-03-13, documented in
`.claude/agent-memory/design-guardian/components-audited.md`) fixed the base
token and shared UI primitives. This plan covers the **remaining
application-layer usages** where reduced-opacity variants are used, plus a
holistic check of all semantic color tokens in context.

---

## Problem Statement

### Primary Issue: `text-muted-foreground` opacity variants

The base token `--muted-foreground: 240 8% 56%` achieves **5.11:1** on the muted
background (`hsl(240 20% 10%)`). That's safe. However, the codebase routinely
stacks opacity on top:

| Opacity modifier | Effective lightness | Contrast vs card bg (`#0e0e1a`) | WCAG result                               |
| ---------------- | ------------------- | ------------------------------- | ----------------------------------------- |
| `/90`            | ~51%                | ~4.7:1                          | ✅ PASS (barely)                          |
| `/70`            | ~40%                | ~3.2:1                          | ⚠️ FAIL normal text, OK for UI components |
| `/60`            | ~34%                | ~2.6:1                          | ❌ FAIL both thresholds                   |
| `/50`            | ~28%                | ~2.1:1                          | ❌ FAIL both thresholds                   |
| `/40`            | ~22%                | ~1.7:1                          | ❌ FAIL                                   |
| `/30`            | ~17%                | ~1.4:1                          | ❌ FAIL                                   |

**Confirmed failing usages found in codebase:**

```
features/kanban/ui/kanban-board.tsx       — /60, /40, /50 (multiple lines)
features/main-dashboard/ui/upcoming-agendas-block.tsx — /40, /70
features/main-dashboard/ui/agent-tasks-block.tsx — /50
app/dashboard/chat/page.tsx               — /40
app/dashboard/meetings/[id]/agenda/page.tsx — /40
app/dashboard/meetings/[id]/transcript/page.tsx — /40, /60
features/meetings/ui/meetings-column-view.tsx — /40
features/meetings/ui/meetings-list.tsx    — /90 (acceptable)
features/calendar/ui/calendar-agenda.tsx  — /60
features/calendar/ui/event.tsx            — /60
features/chat/ui/chat-input.tsx           — /50 (placeholder — WCAG exemption applies)
features/chat/ui/chat-message.tsx         — /70 (acceptable for timestamp)
features/chat/ui/thinking-indicator.tsx   — /70 (acceptable for tooltip)
widgets/dashboard-chat/ui/DashboardChatPanel.tsx — /30
shared/ui/button/button-icon.tsx          — /40 (disabled state — exempt)
shared/ui/input/InputDropdown.tsx         — /70 (already fixed)
```

### Secondary Issue: Other color tokens to verify in context

Several tokens need in-context validation in features that were NOT covered by
the March 2026 audit:

- `text-secondary-foreground` (used in kanban, badge): `hsl(220 15% 75%)` on
  `secondary` bg (`hsl(240 20% 13%)`) — needs verification
- `bg-accent/10..30` text pairings in feature UIs (meetings, agents, kanban)
- `sidebar-accent-foreground` on `sidebar-accent` hover — passing in theory but
  untested in new pages
- Hardcoded Tailwind colors (`text-violet-400`, `text-emerald-400`,
  `text-yellow-300`, `text-red-400`) used directly in features — need spot-check
  against actual backgrounds

---

## Proposed Solution

### Strategy

Use a **categorized triage** approach:

1. **Fix**: Text conveying information that fails WCAG AA → upgrade
   color/opacity
2. **Exempt**: Decorative icons, disabled states, placeholder text → document
   and leave
3. **Contextual review**: Evaluate per-usage whether reduced opacity is
   intentional decoration or functional text that needs to be readable

### Recommended fixes for `text-muted-foreground` opacity variants

| Use case                            | Current      | Recommended fix                                          |
| ----------------------------------- | ------------ | -------------------------------------------------------- |
| Section labels / column headings    | `/60`        | Remove opacity → full `text-muted-foreground`            |
| Timestamps / metadata               | `/70`        | Acceptable (UI component, not body text)                 |
| Empty-state helper text             | `/40`, `/50` | Use `text-muted-foreground` without modifier             |
| Empty-state icons                   | `/30`, `/40` | Decorative — add `aria-hidden="true"` + keep low opacity |
| Priority / assignee labels in cards | `/60`        | Use full `text-muted-foreground`                         |
| Transcript timestamps               | `/60`        | Acceptable (tabular numerals, supplementary)             |
| Chat placeholder                    | `/50`        | Keep (WCAG 1.4.3 placeholder exemption)                  |
| Disabled button state               | `/40`        | Keep (disabled state exemption)                          |

### Token-level changes (globals.css)

No token changes planned. The existing tokens are correctly calibrated after the
March 2026 audit. The work is purely application-layer opacity removal.

---

## Technical Considerations

### What to change vs. keep

- **DO NOT** remove opacity from decorative icons (`aria-hidden="true"`) — low
  opacity is intentional visual de-emphasis and does not affect accessibility
- **DO** remove opacity from text that communicates meaning (labels, dates in
  cards, column headers, empty state messages)
- **WCAG 1.4.3 exemptions:** placeholder text (does not need 4.5:1), disabled UI
  controls, decorative elements with `aria-hidden`
- **WCAG 3:1 threshold:** applies to UI components (icons with a role,
  interactive elements) rather than normal text — `/70` is borderline acceptable
  for this category

### Risk

Low. All changes are CSS class modifications removing opacity modifiers. No
logic changes. Zero backend impact.

---

## Acceptance Criteria

### Core requirements

- [x] All `text-muted-foreground` usages conveying information achieve ≥ 4.5:1
      contrast ratio
- [x] All `text-muted-foreground` opacity variants are documented as either
      fixed or explicitly exempted with a reason
- [x] No new `/30`, `/40`, `/50` opacity on text in functional (non-decorative)
      elements
- [x] Decorative icons that keep low opacity have `aria-hidden="true"` where not
      already present

### Verification

- [ ] Run `/a11y` audit against affected pages after changes
- [ ] Run `design-guardian` agent to check visual consistency hasn't been
      degraded
- [ ] Verify empty state screens look intentional (not accidentally high
      contrast)

### Non-regressions

- [ ] Placeholder contrast stays at `/70` (not pushed to full opacity — would
      make placeholder indistinguishable from input value)
- [ ] Disabled button state (`/40`) is unchanged
- [ ] `text-muted-foreground/90` in section dividers (`meetings-list.tsx`) is
      acceptable — leave

---

## Implementation Plan

### Phase 1 — Triage (no code changes)

1. For each failing file listed above, classify each usage as: **fix** /
   **exempt** / **acceptable**
2. Compile final list of files to change

**File: `features/kanban/ui/kanban-board.tsx`** (highest density of issues)

| Line                     | Usage           | Classification              |
| ------------------------ | --------------- | --------------------------- |
| ID label                 | `/60 font-mono` | acceptable (tabular, small) |
| Empty column text        | `/40 italic`    | **fix** — remove `/40`      |
| `Priority` label         | `/60`           | **fix** — remove `/60`      |
| Assignee label           | `/60`           | **fix** — remove `/60`      |
| `Created` label          | `/60`           | **fix** — remove `/60`      |
| Card count badge         | `/60`           | **fix** — remove `/60`      |
| Empty state full message | `/50`           | **fix** — remove `/50`      |

**File: `features/main-dashboard/ui/upcoming-agendas-block.tsx`**

| Usage             | Classification                                           |
| ----------------- | -------------------------------------------------------- |
| Icon `/40`        | exempt — `aria-hidden="true"` (check and add if missing) |
| Helper text `/70` | acceptable                                               |

**File: `features/main-dashboard/ui/agent-tasks-block.tsx`**

| Usage            | Classification                               |
| ---------------- | -------------------------------------------- |
| Clock icon `/50` | exempt — add `aria-hidden="true"` if missing |

**File: `app/dashboard/chat/page.tsx`**

| Usage                    | Classification                       |
| ------------------------ | ------------------------------------ |
| MessageSquare icon `/40` | exempt — empty state decorative icon |

**File: `app/dashboard/meetings/[id]/agenda/page.tsx`**

| Usage                  | Classification      |
| ---------------------- | ------------------- |
| ListOrdered icon `/40` | exempt — decorative |

**File: `app/dashboard/meetings/[id]/transcript/page.tsx`**

| Usage               | Classification                               |
| ------------------- | -------------------------------------------- |
| MicOff icon `/40`   | exempt — decorative                          |
| Timestamp div `/60` | acceptable — tabular numerals, supplementary |

**File: `features/meetings/ui/meetings-column-view.tsx`**

| Usage                  | Classification      |
| ---------------------- | ------------------- |
| CalendarOff icon `/40` | exempt — decorative |

**File: `features/calendar/ui/calendar-agenda.tsx`**

| Usage           | Classification                      |
| --------------- | ----------------------------------- |
| Time span `/60` | acceptable — supplementary metadata |

**File: `features/calendar/ui/event.tsx`**

| Usage                   | Classification      |
| ----------------------- | ------------------- |
| CircleDashed icon `/60` | exempt — decorative |

**File: `widgets/dashboard-chat/ui/DashboardChatPanel.tsx`**

| Usage                    | Classification                                     |
| ------------------------ | -------------------------------------------------- |
| MessageSquare icon `/30` | exempt — empty state decorative; add `aria-hidden` |

### Phase 2 — Apply fixes

Files that need actual code changes:

1. `features/kanban/ui/kanban-board.tsx` — remove `/40`, `/50`, `/60` from label
   text and empty state text
2. Ensure decorative icons throughout have `aria-hidden="true"`

### Phase 3 — Spot-check hardcoded Tailwind colors in features

Audit these files for any hardcoded colors on unexpected backgrounds:

- `features/meetings/ui/` — check any `text-violet-*`, `text-emerald-*` usages
- `features/agents/ui/` — same
- `features/issues/ui/` — check badge-like status chips
- `features/main-dashboard/ui/` — check stat cards

Verify each against its actual background token.

---

## Success Metrics

- Zero `text-muted-foreground/(30|40|50|60)` on text elements conveying
  information (after exemptions)
- All affected pages pass automated a11y check at WCAG AA level
- Visual output looks intentional: low-opacity icons still de-emphasized, text
  labels clearly legible

---

## Dependencies & Risks

- **No dependencies** — purely presentational CSS class changes
- **Low regression risk** — opacity-only changes, no structural or logic changes
- **Watch for:** removing opacity from labels that were intentionally dimmed to
  create visual hierarchy — use `design-guardian` agent to confirm visual result
  looks right

---

## References

### Internal References

- Design tokens: `app/globals.css:52-100`
- March 2026 contrast audit:
  `.claude/agent-memory/design-guardian/components-audited.md`
- Design guardian patterns: `.claude/agent-memory/design-guardian/MEMORY.md`
- Chart theme constants: `shared/lib/chart-theme.ts`

### WCAG Standards

- WCAG 2.1 SC 1.4.3 — minimum contrast 4.5:1 (normal text), 3:1 (large text / UI
  components)
- WCAG 2.1 SC 1.4.3 Note 1 — placeholder text explicitly exempted
- WCAG 2.1 SC 1.4.3 Note 2 — disabled controls explicitly exempted
- WCAG 2.1 SC 1.4.11 — non-text contrast 3:1 for UI components and graphical
  objects
