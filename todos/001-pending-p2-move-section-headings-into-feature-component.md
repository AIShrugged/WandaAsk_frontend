---
status: pending
priority: p2
issue_id: '001'
tags: [code-review, architecture, fsd, profile]
dependencies: []
---

# Move section headings/hr divider into a feature component, not the account page

## Problem Statement

The deepened plan proposes adding `<section>`, `<h2>` headings, description
paragraphs, and an `<hr>` divider directly inside
`app/dashboard/profile/account/page.tsx`. This contradicts the established
project pattern: every other profile sub-page is a thin shell that delegates all
layout markup to feature components.

Placing layout HTML inside `app/` page files violates FSD layer responsibility —
`app/` handles routing only, business/display logic lives in `features/`.

## Findings

- All existing profile sub-pages are thin shells: `calendar/page.tsx`,
  `appearance/page.tsx`, `menu/page.tsx`, `telegram/page.tsx` each return a
  single feature component with zero layout markup in the page file itself.
- `AppearanceSection.tsx` uses `<section aria-labelledby='appearance-heading'>`
  inside the _feature component_, not in the page.
- No profile/form page in the codebase uses `<hr className="border-border" />`
  as a section divider. The only `<hr>` in the codebase is in `menu-sidebar.tsx`
  using inline style for nav separation.
- The plan's `account/page.tsx` snippet adds `<section>`, `<h2>`, `<p>`
  description paragraphs, and `<hr>` directly in the page file — a new pattern
  with no established precedent.

## Proposed Solutions

### Option 1: Create `ProfileAccountSection` feature component (Recommended)

**Approach:** Create `features/user-profile/ui/ProfileAccountSection.tsx` that
contains both forms plus the heading/divider structure. The `account/page.tsx`
fetches `getUser()` and passes `user` to this component, keeping the page as a
thin shell.

```tsx
// features/user-profile/ui/ProfileAccountSection.tsx
'use client'; // or keep as server component if no interactivity needed at this level

interface Props {
  user: UserProps | null;
}

export function ProfileAccountSection({ user }: Props) {
  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h2 className='text-base font-semibold mb-6'>Profile Information</h2>
        {user ? (
          <ProfileForm user={user} />
        ) : (
          <p className='text-sm text-muted-foreground'>
            Unable to load profile.
          </p>
        )}
      </section>
      <hr className='border-border' />
      <section>
        <h2 className='text-base font-semibold mb-6'>Change Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
```

```tsx
// app/dashboard/profile/account/page.tsx — thin shell
export default async function ProfileAccountPage() {
  const { data: user } = await getUser();
  return <ProfileAccountSection user={user} />;
}
```

**Pros:**

- Matches established pattern exactly (all other profile pages do this)
- Feature component owns its own layout/headings — correct FSD responsibility
- Page file stays minimal and consistent

**Cons:**

- One extra component file

**Effort:** 30 minutes  
**Risk:** Low

---

### Option 2: Check existing feature components first

**Approach:** Before creating anything new, check if `ProfileForm` and
`ChangePasswordForm` can each be updated to include their own heading (like
`AppearanceSection` does with `aria-labelledby`). Then the page just stacks them
with spacing.

**Pros:**

- No new wrapper component
- Each form self-describes its own heading

**Cons:**

- Changes API of existing components (adds visual heading that may not be wanted
  in all usages)

**Effort:** 20 minutes  
**Risk:** Low

## Recommended Action

To be filled during triage. Recommended: Option 1 — create
`ProfileAccountSection` wrapper in `features/user-profile/ui/`.

## Technical Details

**Affected files:**

- `app/dashboard/profile/account/page.tsx` — keep as thin shell, move layout
  markup out
- `features/user-profile/ui/ProfileAccountSection.tsx` — new file (Option 1)
- `features/user-profile/index.ts` — export `ProfileAccountSection`

**Pattern reference:**

- `app/dashboard/profile/appearance/page.tsx` +
  `features/user-profile/ui/AppearanceSection.tsx` — follow this exact pattern

## Resources

- Plan:
  `docs/plans/2026-05-15-refactor-profile-merge-info-password-into-account-tab-plan.md`
- Pattern agents: pattern-recognition-specialist, architecture-strategist
  reviews

## Acceptance Criteria

- [ ] `app/dashboard/profile/account/page.tsx` contains no `<section>`, `<h2>`,
      `<hr>`, or description paragraphs
- [ ] Layout markup lives in a feature component
- [ ] Pattern matches how `appearance/page.tsx` delegates to `AppearanceSection`
- [ ] No FSD boundary violations introduced

## Work Log

### 2026-05-15 — Discovered during plan review

**By:** Claude Code  
**Actions:**

- Pattern-recognition-specialist agent scanned all profile page files and
  confirmed heading markup belongs in feature components
- Architecture-strategist confirmed FSD boundary requirement
