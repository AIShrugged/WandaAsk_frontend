---
status: pending
priority: p2
issue_id: '008'
tags: [code-review, html-semantics, preferences-tab-refactor]
dependencies: ['006']
---

# Drop the outer `<section>` wrapper around AppearanceSection in PreferencesSection

## Problem Statement

The plan's `PreferencesSection` wraps `AppearanceSection` in an outer
`<section>` element. `AppearanceSection` already renders its own
`<section aria-labelledby='appearance-heading'>` internally. The result is a
nested `<section>` inside a `<section>` — semantically redundant.

## Findings

From `features/user-profile/ui/AppearanceSection.tsx` (line 42):

```tsx
return (
  <section aria-labelledby='appearance-heading'>
    {/* radio cards for dark/light */}
  </section>
);
```

The plan's `PreferencesSection` adds another wrapper:

```tsx
<section>                           {/* ← outer, redundant */}
  <div className="mb-6">
    <h2>Theme</h2>
    <p>...</p>
  </div>
  <AppearanceSection ... />         {/* ← already renders <section> internally */}
</section>
```

This produces
`<section><div/><section aria-labelledby='...'>...</section></section>`.

The `MenuSettingsForm` does NOT render its own outer `<section>`, so the outer
wrapper there is needed (it gives the heading div a structural container).

## Proposed Solutions

### Option A — Use `<div>` instead of `<section>` for the AppearanceSection wrapper (Recommended, Small)

```tsx
<div>
  {' '}
  {/* ← div, not section */}
  <div className='mb-6'>
    <h2 className='text-base font-semibold'>Theme</h2>
    <p className='text-sm text-muted-foreground mt-1'>
      Choose your preferred color scheme.
    </p>
  </div>
  <AppearanceSection currentPreferences={preferences ?? {}} />
</div>
```

**Pros:** Avoids nested landmarks; the inner `<section>` in AppearanceSection
remains the semantic landmark as intended. **Cons:** None.

### Option B — Remove the heading div and let AppearanceSection own its own heading (Medium)

Add an `<h2 id='appearance-heading'>Theme</h2>` inside `AppearanceSection`
itself (it already has `aria-labelledby='appearance-heading'` but no matching
element). Remove the outer wrapper entirely from `PreferencesSection`.

**Pros:** Fixes the pre-existing accessibility gap in `AppearanceSection` (the
`aria-labelledby` references a non-existent element). Cleaner component
boundaries. **Cons:** Modifies a component outside the direct scope of this
refactor; risk of visual change to the existing Appearance standalone tab if
it's still in use during rollout.

## Recommended Action

Option A — simplest fix, zero impact on `AppearanceSection` itself.

## Technical Details

**Affected file (plan artifact — not yet created):**

- `features/user-profile/ui/PreferencesSection.tsx`

## Acceptance Criteria

- [ ] `AppearanceSection` is NOT wrapped in a `<section>` in
      `PreferencesSection`
- [ ] The "Theme" heading `<div>` is preserved above `AppearanceSection`
- [ ] No nested `<section>` elements in the rendered HTML
- [ ] Accessibility tree has one landmark per logical block

## Work Log

- 2026-05-15: Identified by code-simplicity-reviewer during `/workflows:review`.
