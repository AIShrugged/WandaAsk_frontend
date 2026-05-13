---
title: 'fix: Onboarding file attachment row layout'
type: fix
status: active
date: 2026-05-13
---

# fix: Onboarding file attachment row layout

## Problem

`features/onboarding/ui/onboarding-file-upload.tsx` renders each uploaded file
row incorrectly:

1. **Filename is severely truncated** — shows only `€ .md` instead of the full
   name. The `<div class="flex min-w-0 flex-1">` content wrapper doesn't
   constrain the inner `<span class="truncate">` correctly because the `<div>`
   itself can still grow unbounded inside the parent flex row.
2. **Extension badge duplicates** — `.md` appears both inside the truncated name
   and as a separate badge on the right.
3. **Delete button stretches full width** — `Button` component defaults to
   `fullWidth={true}` which applies `w-full`. The override
   `className='h-7 w-7 ...'` sets a fixed size but `clsx` doesn't deduplicate
   Tailwind conflicts at runtime, so `w-full` wins and the button expands across
   the row.

**Screenshot evidence:** paperclip icon | `€ .md` (severely clipped) | trash
icon stretched across remaining space.

## Root Cause Analysis

### Bug 1 — Truncation chain broken

The current row structure:

```
<li class="flex items-center gap-3">          ← flex container, no min-w-0
  <Paperclip shrink-0 />
  <div class="flex min-w-0 flex-1 ...">       ← flex-1 content wrapper
    <span class="truncate">filename</span>    ← truncate target
    <span class="shrink-0">size</span>
  </div>
  <span class="shrink-0">ext badge</span>
  <Button class="h-7 w-7 shrink-0" />        ← Button is w-full by default
</li>
```

The `<li>` itself has no `min-w-0`. As a flex child of
`<ul class="flex flex-col">`, `<li>` gets an implicit minimum width equal to its
content. This means the inner `flex-1` div can never actually be constrained —
it always sizes to fit content rather than its container.

### Bug 2 — `w-full` on Button overrides `w-7`

`Button` passes `fullWidth={true}` as default → `w-full` is added to base
classes → `clsx(base, sizes, variants, className)` places `w-full` first and
`w-7` from className last, BUT Tailwind does not deduplicate conflicting width
utilities at runtime. `w-full` wins because it appears in the generated
stylesheet at a higher specificity (or equal specificity with the cascade
resolving to `w-full`). The fix is to pass `fullWidth={false}` explicitly.

## Acceptance Criteria

- [ ] Full filename is visible in the row (no premature truncation)
- [ ] If the filename is too long for the row width, it truncates with ellipsis
      — the extension badge and delete button always remain visible
- [ ] Delete button is `28×28 px` (h-7 w-7), not stretched
- [ ] File size (`1.2 MB`) is visible next to the filename
- [ ] Extension badge (`.pdf`, `.md`) is shown on the right side of the row
- [ ] Layout is stable at all container widths (`max-w-2xl` = 672px down to
      ~320px)
- [ ] `npm run lint` passes with no errors

## Implementation

**Single file to change:** `features/onboarding/ui/onboarding-file-upload.tsx`

### Fix 1 — Correct the flex truncation chain

Apply `min-w-0` at every level from `<li>` down to the text `<span>`. The
canonical pattern used elsewhere in the codebase (e.g.
`features/issues/ui/issue-linked-task.tsx`):

```
outer flex container → min-w-0
  growing child div  → min-w-0 flex-1
    text span        → truncate (no min-w-0 needed on inline element)
```

Change the `<li>` to include `min-w-0 overflow-hidden`:

```tsx
// Before
<li className='flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background/30 px-3 py-2'>

// After
<li className='flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background/30 px-3 py-2'>
```

The inner wrapper `<div class="flex min-w-0 flex-1 items-center gap-2">` is
already correct — keep it.

### Fix 2 — Pass `fullWidth={false}` to the delete Button

```tsx
// Before
<Button
  type='button'
  variant={BUTTON_VARIANT.ghost}
  className='h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive'
  disabled={isBusy}
  onClick={...}
>

// After
<Button
  type='button'
  variant={BUTTON_VARIANT.ghost}
  fullWidth={false}
  className='h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive'
  disabled={isBusy}
  onClick={...}
>
```

### Final row structure

```tsx
<li className='flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-border bg-background/30 px-3 py-2'>
  <Paperclip className='h-4 w-4 shrink-0 text-muted-foreground' />
  <div className='flex min-w-0 flex-1 items-center gap-2'>
    <span className='truncate text-sm text-foreground'>{displayName}</span>
    {fileSizes.has(attachment.id) && (
      <span className='shrink-0 text-xs text-muted-foreground'>
        {formatSize(fileSizes.get(attachment.id)!)}
      </span>
    )}
  </div>
  {ext && (
    <span className='shrink-0 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground'>
      {ext}
    </span>
  )}
  <Button
    type='button'
    variant={BUTTON_VARIANT.ghost}
    fullWidth={false}
    className='h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive'
    disabled={isBusy}
    onClick={...}
  >
    <Trash2 className='h-3.5 w-3.5' />
  </Button>
</li>
```

## Files

| File                                                | Change                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `features/onboarding/ui/onboarding-file-upload.tsx` | Add `min-w-0` to `<li>`, add `fullWidth={false}` to delete Button |

## Verification

1. `npm run dev` → navigate to `/onboarding`
2. Upload a file with a long name (e.g. `my-very-long-document-name-2026.pdf`) →
   full name should be visible, truncated with `…` only when necessary
3. Upload a short-named file (e.g. `a.md`) → name shows fully, delete button is
   `28×28px` square
4. Verify delete button does not stretch across the row
5. Verify extension badge and file size are both visible
6. `npm run lint` → no errors
