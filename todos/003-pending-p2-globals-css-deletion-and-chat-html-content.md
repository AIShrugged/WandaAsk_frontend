---
status: pending
priority: p2
issue_id: '003'
tags: [code-review, design-system, css, migration]
dependencies: ['001']
---

# Phase 1 Must Delete Old Token System + Migrate chat-html-content Block

## Problem Statement

Two things in `globals.css` are not mentioned in the plan's Phase 1 scope:

1. The existing `@layer utilities` block (lines 45-91) defines `.bg-primary`,
   `.text-primary`, `.text-accent`, `.border-primary`, etc. as manual utility
   classes. After `@theme inline` generates the same class names with new HSL
   values, both definitions exist. The cascade winner is undefined by insertion
   order, producing inconsistent results. The old block MUST be deleted.

2. The `chat-html-content` CSS block (lines 98-181) applies styles using old CSS
   variable names: `var(--bg-secondary)`, `var(--text-primary)`,
   `var(--border-table)`, `var(--bg-hover-light)`, `var(--color-primary)`,
   `var(--color-white)`. After the old variables are removed, this block
   silently produces unstyled chat message content. It is not caught by any
   Tailwind class find-and-replace.

## Findings

Current `@layer utilities` block to delete (app/globals.css lines 45-91):

```css
@layer utilities {
  .bg-primary {
    background-color: var(--bg-primary);
  }
  .bg-secondary {
    background-color: var(--bg-secondary);
  }
  /* ... ~20 more manual utility definitions ... */
  .hover\:bg-hover-light:hover {
    background-color: var(--bg-hover-light);
  }
  .hover\:bg-hover:hover {
    background-color: var(--bg-hover);
  }
  /* ... */
}
```

`chat-html-content` block (app/globals.css lines 98-181) references old vars:

- `var(--bg-secondary)` → must become `hsl(var(--muted))`
- `var(--text-primary)` → must become `hsl(var(--foreground))`
- `var(--border-table)` → must become `hsl(var(--border))`
- `var(--bg-hover-light)` → must become `hsl(var(--accent) / 0.5)`
- `var(--color-primary)` → must become `hsl(var(--primary))`
- `var(--color-white)` → must become `hsl(var(--card))`

## Proposed Solutions

### Option A: Delete + migrate in Phase 1 (Recommended)

Add to Phase 1 checklist:

1. Delete entire `@layer utilities` block
2. Update all CSS var references in `chat-html-content` block to use new token
   names

This keeps Phase 1 self-contained and prevents cascade conflicts.

### Option B: Migrate chat-html-content in Phase 4

Keep Phase 1 focused on the `@theme inline` + `:root` block. Migrate
`chat-html-content` when updating the chat feature pages in Phase 4. Must be
noted explicitly in Phase 4 checklist.

## Acceptance Criteria

- [ ] No `@layer utilities` block with manual color utilities exists in
      globals.css after Phase 1
- [ ] `chat-html-content` CSS block uses `hsl(var(--*))` variable references,
      not old `--bg-*` / `--text-*` names
- [ ] Chat message rendering is visually correct after Phase 1 lands

## Work Log

- 2026-02-20: Identified during multi-agent plan review
  (architecture-strategist)
