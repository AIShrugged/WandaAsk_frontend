---
status: pending
priority: p1
issue_id: '002'
tags: [code-review, design-system, migration, audit]
dependencies: ['001']
---

# Token Semantic Change Audit Required Before Migration

## Problem Statement

Three critical token classes change their semantic meaning in the new design
system. Every file using these classes must be found and updated. The plan's
migration table lists these at a high level but does not identify affected
files. Attempting migration without this audit will produce silent visual bugs
(invisible text, missing borders) that are hard to diagnose.

## Findings

### `text-accent` → must become `text-primary`

**Current meaning:** green brand color (`#4FB268`) as text color **New
meaning:** `accent` is a light hover/tint background color, NOT a text color
**After migration without fix:** text renders as near-invisible light green tint
on white backgrounds

Known usages (incomplete — run grep):

- `features/follow-up/ui/follow-up-item.tsx:26` — ChevronRight icon
- `features/chat/ui/chat-list.tsx:95` — icons
- `features/chat/ui/chat-window.tsx:75` — Loader2 icon, typing indicator dots
- `shared/ui/button/button-back.tsx` — back arrow icon
- `shared/ui/input/InputPassword.tsx` — eye toggle icon
- Many more across navigation, buttons, and icon elements

### `text-secondary` → must become `text-muted-foreground`

**Current meaning:** muted gray-green text (`#818f85`) for secondary labels
**New meaning:** `secondary` is a surface/background color in shadcn convention
**After migration without fix:** text renders as light gray surface color
(barely visible on white)

### `border-primary` → requires two classes: `border` + `border-border`

**Current meaning:** CSS shorthand `border: 1px solid var(--border-primary)`
(sets width + color) **New meaning (Tailwind-generated):** only `border-color`
property (no border width) **After migration without fix:** all borders
disappear — form inputs, cards, table rows lose visible borders

Affected files include: `shared/ui/card/Card.tsx`, all `shared/ui/input/`
components, feature list items

## Proposed Solutions

### Option A: Run pre-migration grep audit (Recommended)

Before starting Phase 1, run these greps and create a replacement checklist:

```bash
# Find all text-accent usages
grep -rn "text-accent\|hover:text-accent" --include="*.tsx" --include="*.ts" .

# Find all text-secondary usages (text context, not bg)
grep -rn '"text-secondary\|text-secondary ' --include="*.tsx" .

# Find all border-primary usages
grep -rn "border-primary\|border-secondary\|border-layout" --include="*.tsx" .

# Find remaining hardcoded hex values
grep -rn '#[0-9a-fA-F]\{3,6\}' --include="*.tsx" . | grep -v "node_modules\|\.git"
```

Apply replacements during Phase 3 (component updates) for `shared/ui/`, and
during Phase 4 for feature files.

### Option B: ESLint rule to enforce token usage

Add an ESLint rule or Tailwind lint to flag `text-accent` and `text-secondary`
in future code after migration. This catches regressions but does not help with
the migration itself.

## Acceptance Criteria

- [ ] `grep -rn "text-accent"` returns zero results after migration
- [ ] `grep -rn "text-secondary"` returns zero results where used as a text
      color
- [ ] All form inputs render visible borders after Phase 1 + Phase 3 land
- [ ] `grep -rn '#[0-9a-fA-F]\{6\}'` in `*.tsx` returns zero results

## Work Log

- 2026-02-20: Identified during multi-agent plan review
  (architecture-strategist)
