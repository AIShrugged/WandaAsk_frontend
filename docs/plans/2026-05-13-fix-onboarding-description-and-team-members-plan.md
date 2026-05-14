---
title: 'fix: Onboarding description overflow and team member label clipping'
type: fix
status: active
date: 2026-05-13
---

# fix: Onboarding description overflow and team member label clipping

## Overview

Two visual/UX bugs on the onboarding preview step (`app/onboarding/`) that
appear after the AI backend generates the org structure:

1. **Description textarea** — fixed height + `resizable={false}` causes
   AI-generated text to be hidden inside a scrollable box that is too small.
2. **Team member rows** — floating labels (Name / Email / Role) are
   clipped/invisible because the row container has insufficient vertical space
   for labels that float above the input border.

---

## Bug 1 — Description textarea overflow

### Root cause

`onboarding-preview-step.tsx:63–71` and `onboarding-input-step.tsx:95–104` both
pass:

```tsx
<Textarea
  resizable={false}
  height={100}   // or 160 on input step
  ...
/>
```

Inside `shared/ui/input/textarea.tsx`, when `height` is provided:

- The outer div gets `style={{ height }}` — fixed pixel height
- The `<textarea>` gets `height: '100%', overflowY: 'auto'`
- The `field-sizing-content` class (auto-grow) is **not applied** because it
  only activates when `!height`

Result: the box stays fixed at 100 px while AI-generated descriptions can be
3–5× taller, forcing a scroll inside a tiny box.

### Proposed fix

**Preview step (`onboarding-preview-step.tsx`):** Remove `height={100}` and
`resizable={false}`.  
Use the textarea's native auto-grow behavior (`field-sizing-content`,
`min-h-20 max-h-96`) — it already exists in `Textarea` when no `height` is
given.

```tsx
// Before
<Textarea
  label='Description'
  value={data.organization.description}
  resizable={false}
  height={100}
  onChange={...}
/>

// After
<Textarea
  label='Description'
  value={data.organization.description}
  onChange={...}
/>
```

`field-sizing-content` makes the textarea grow to fit its content automatically
(supported in all modern browsers; graceful degradation falls back to
`min-h-20`).

**Input step (`onboarding-input-step.tsx`):** Same treatment — remove
`height={160}` and `resizable={false}`. The user types here, so auto-grow is
even more natural.

**Goal card (`onboarding-goal-card.tsx`):** Audit for the same pattern — if it
also uses a fixed-height textarea, apply the same fix.

### Acceptance criteria

- [ ] Description textarea in preview step auto-grows to show all AI-generated
      text without scrolling
- [ ] Description textarea in input step auto-grows as the user types
- [ ] Max height cap (`max-h-96`) prevents the textarea from growing past the
      viewport
- [ ] No layout shift on initial render (min-h-20 ensures a stable baseline)

---

## Bug 2 — Team member floating labels clipped

### Root cause

`onboarding-team-member-row.tsx:19–20`:

```tsx
<div className='flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 py-2'>
  <div className='grid flex-1 grid-cols-3 gap-2 min-w-0'>
    <Input label='Name' value={member.name} ... />
```

Inside `shared/ui/input/Input.tsx:104–126`, when `floatingActive` is true (i.e.,
the input has a value — which it always does when pre-populated by AI), the
label is positioned at:

```
top: -9   (outside the h-9 input box, floated above)
```

The outer row div uses `items-center` and has only `py-2` (8 px) top padding.
The label at `top: -9` (9 px above the input top edge) pushes the label into a
space that the parent div does not allocate.  
The label element has `position: absolute` relative to the inner input wrapper
div (not the row), but the row's `overflow` clipping and `items-center`
alignment leave no visible room for the floating label.

**Why "N E Role" is partially visible in the screenshot:** Only the very bottom
pixels of the floating labels bleed through — the label is partially clipped by
the top of the row container.

### Proposed fix

Add `pt-4` (or `pt-3`) to the row container to give vertical room above each
input for its floating label:

```tsx
// Before
<div className='flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 py-2'>

// After
<div className='flex items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 pt-4 pb-2'>
```

`pt-4` = 16 px — gives the floating label (which sits at `top: -9` relative to
the input, i.e. ~9 px above the input's top edge) enough room to render fully.  
Alternatively, align the row to `items-start` with adjusted padding:

```tsx
// Alternative — flex-start alignment with symmetric padding
<div className='flex items-start gap-2 rounded-[var(--radius-card)] border border-border bg-surface/40 px-3 py-3 mt-2'>
```

**Recommended:** `pt-4 pb-2` keeps the trash icon vertically centered with the
input while giving labels room to float.

Also audit `align-items` — the trash `Button` should stay vertically centered
relative to the input, not the label. Use `items-end` + padding bottom on button
if needed, or keep `items-center` and let it work with the extra top padding.

### Acceptance criteria

- [ ] Name, Email, and Role floating labels are fully visible in pre-populated
      rows after AI generation
- [ ] Labels are also visible when manually adding a new member and typing a
      value
- [ ] The trash icon remains visually centered relative to the input field (not
      the label)
- [ ] No regression on empty rows (labels at default position, no overflow)

---

## Files to change

| File                                                    | Change                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| `features/onboarding/ui/onboarding-preview-step.tsx`    | Remove `height={100}` and `resizable={false}` from `<Textarea>` |
| `features/onboarding/ui/onboarding-input-step.tsx`      | Remove `height={160}` and `resizable={false}` from `<Textarea>` |
| `features/onboarding/ui/onboarding-team-member-row.tsx` | Change `py-2` → `pt-4 pb-2` on the outer row container          |
| `features/onboarding/ui/onboarding-goal-card.tsx`       | Audit — if it has a fixed-height Textarea, remove `height` prop |

No changes needed to `shared/ui/input/textarea.tsx` or
`shared/ui/input/Input.tsx` — the root cause is the _usage_ not the shared
component.

---

## Implementation notes

- Both fixes are pure CSS/prop changes — no state, no API, no new components.
- `field-sizing-content` is a CSS property (≥Chrome 123, Firefox 129, Safari
  17.4). The existing `Textarea` already applies it as the default when no
  `height` prop is passed — no new CSS needed.
- The floating label positioning at `top: -9` is intentional design in
  `Input.tsx` — do not change `Input.tsx`. Fix the caller's container padding.
