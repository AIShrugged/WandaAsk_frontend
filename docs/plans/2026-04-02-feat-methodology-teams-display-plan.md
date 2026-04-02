---
title:
  'feat: Show assigned teams for each methodology on /dashboard/methodology'
type: feat
status: completed
date: 2026-04-02
---

# feat: Show assigned teams for each methodology on /dashboard/methodology

## Overview

On `/dashboard/methodology`, each `MethodologyItem` already receives the full
`teams` array from the backend (via `MethodologyResource`). Currently teams are
only indicated by a green "Active" badge with a native browser `title` tooltip.
This plan makes the assigned teams **visible without requiring hover** — showing
team names as chips/tags directly in the list item row.

## Current State

The existing implementation (from
`2026-04-01-feat-active-methodology-badge-plan.md`, status: completed):

- `MethodologyProps.teams: MethodologyTeam[]` — typed and populated from API
- `methodology-item.tsx` renders `isActive` badge + `title` tooltip with team
  names
- No visible team names in the default view

**What's missing:** team names are only discoverable on hover (native tooltip).
Users need to see at a glance which teams use which methodology.

## Backend Contract

No backend changes required. `GET /organizations/{organization}/methodologies`
already returns teams per methodology:

```ts
interface MethodologyTeam {
  id: number;
  name: string;
  slug: string;
  employee_count: number;
}

interface MethodologyProps {
  // ...
  teams: MethodologyTeam[]; // ← already populated
}
```

Source: `app/Http/Resources/API/v1/MethodologyResource.php` — `teams` field is
`TeamResource::collection($this->teams)`.

## Proposed Solution

Add a row of team name chips below the methodology name in `MethodologyItem`.
Each chip shows the team name. Keep the existing "Active" badge but remove the
redundant `title` tooltip since teams are now explicitly visible.

### Visual Layout (per item)

```
┌─────────────────────────────────────────────────────────┐
│ Methodology Name         [Default] [Active]    [actions] │
│ Core Team  · Sales Team  · Product Team                  │
└─────────────────────────────────────────────────────────┘
```

For items with no teams assigned, the second line is omitted.

## Technical Approach

### 1. Update `methodology-item.tsx`

**File:** `features/methodology/ui/methodology-item.tsx`

Add team chips below the header row, inside the Link element (or as a sibling
div — keep it non-interactive since the whole row is already a link).

```tsx
export default function MethodologyItem({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`;
  const teams = Array.isArray(methodology.teams) ? methodology.teams : [];
  const isActive = teams.length > 0;

  return (
    <div className='border-b border-border'>
      <div className='py-6 flex items-center justify-between group'>
        <Link
          className='cursor-pointer flex-1 flex flex-col gap-1.5'
          href={route}
        >
          <div className='flex items-center gap-3'>
            <H3>{methodology.name}</H3>
            {methodology.is_default && (
              <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border'>
                Default
              </span>
            )}
            {isActive && (
              <span className='inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'>
                Active
              </span>
            )}
          </div>
          {teams.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {teams.map((team) => (
                <span
                  key={team.id}
                  className='inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground ring-1 ring-border/50'
                >
                  {team.name}
                </span>
              ))}
            </div>
          )}
        </Link>

        <MethodologiesAction methodology={methodology} />
      </div>
    </div>
  );
}
```

**Changes from current implementation:**

- Link flex direction changed from `flex items-center gap-3` →
  `flex flex-col gap-1.5`
- Name + badges moved into an inner `<div className='flex items-center gap-3'>`
- New `teams.length > 0` block renders team chips below the name row
- `title` attribute removed from the Active badge (redundant now)

### 2. No other files need changes

| File                                           | Change                                 |
| ---------------------------------------------- | -------------------------------------- |
| `features/methodology/ui/methodology-item.tsx` | Add team chips row, restructure layout |
| Everything else                                | No change                              |

The `teams` data flows through unchanged:

- `methodology.ts` API → already fetches teams ✓
- `MethodologyList` → passes `methodology` to `MethodologyItem` ✓
- `MethodologyProps` types → already correct ✓

## Acceptance Criteria

- [x] Each methodology item with assigned teams shows team names as chips below
      the methodology name
- [x] Chips are visible without hovering — no tooltip-only display
- [x] Items with no assigned teams show no chips row (no empty space)
- [x] "Active" badge is still shown when `teams.length > 0`
- [x] "Default" badge is still shown when `is_default === true`
- [x] Existing Edit / Delete actions are unaffected
- [x] Layout is responsive — chips wrap on narrow screens (`flex-wrap`)
- [x] No new API calls introduced

## Edge Cases

- **Many teams (5+):** `flex-wrap` handles overflow naturally; chips wrap to
  next line
- **Long team name:** Chip text stays on one line; rely on natural wrapping
- **Empty teams array / missing field:** `Array.isArray(methodology.teams)`
  guard prevents crashes on legacy/missing data
- **Default methodology with teams:** Both "Default" and "Active" badges shown;
  chips row also rendered

## Design Notes

Team chip style: `bg-muted/50 text-muted-foreground ring-1 ring-border/50` —
deliberately more subdued than the "Active" badge to establish visual hierarchy:

- Primary info: methodology name (H3)
- Status badges: Active / Default (colored rings)
- Supporting info: team names (muted chips)

## References

- Previous plan (completed):
  `docs/plans/2026-04-01-feat-active-methodology-badge-plan.md`
- `features/methodology/ui/methodology-item.tsx` — only file to change
- `features/methodology/model/types.ts` — types already correct, no changes
- Backend: `app/Http/Resources/API/v1/MethodologyResource.php` — teams field
  confirmed
