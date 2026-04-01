---
title: 'feat: Visual active methodology badge on /dashboard/methodology'
type: feat
status: completed
date: 2026-04-01
---

# feat: Visual active methodology badge on /dashboard/methodology

## Overview

On the `/dashboard/methodology` page, a methodology is considered **active**
when at least one team in the organization has it assigned (i.e.,
`Team.methodology_id` points to it). Currently all methodologies look identical
in the list — there is no visual indicator of which one is driving live
follow-up analyses. This plan adds a badge/indicator to each active methodology
item.

## Problem Statement

Users cannot tell from the UI which methodology is currently powering their
team's follow-up analysis. The `is_default` flag marks the system-default
fallback methodology (id=1, locked), but the truly "active" methodology per team
is determined by `Team.methodology_id`. These can be different — an org may have
multiple custom methodologies, each assigned to different teams.

## Key Backend Contract

**`MethodologyResource`** already returns the `teams` array for each
methodology:

```ts
// features/methodology/model/types.ts — MethodologyProps
interface MethodologyProps {
  id: number;
  name: string;
  text: string;
  scheme: unknown;
  scheme_version: string;
  is_default: boolean;
  organization_id: string;
  teams: MethodologyTeam[]; // ← teams currently assigned to this methodology
}

interface MethodologyTeam {
  id: number;
  name: string;
  slug: string;
  employee_count: number;
}
```

A methodology is **active** when `methodology.teams.length > 0`.

The `is_default` methodology (id=1) is the fallback — teams are only reassigned
to it when their custom methodology is deleted. It should be treated separately
(already locked/read-only in the UI).

> No new API endpoint is needed. The `teams` field is already populated by
> `MethodologyResource::collection()` in the existing
> `GET /organizations/{organization}/methodologies` endpoint.

## Proposed Solution

Derive `isActive` in `MethodologyItem` from `methodology.teams.length > 0`. Add
a visual badge ("Active") next to the methodology name for methodologies that
have at least one assigned team.

The `is_default` methodology gets a separate "Default" badge (it already can't
be edited/deleted — this makes it visually distinct too).

## Technical Approach

### 1. No backend changes required

`MethodologyResource.toArray()` already includes
`'teams' => TeamResource::collection($this->teams)`. The `teams` relation is
eager-loaded via the `visibleFor` scope chain, so no N+1 risk.

Verify: `app/Http/Resources/API/v1/MethodologyResource.php` — `teams` field
present. ✓

### 2. Frontend type update — `features/methodology/model/types.ts`

Add missing fields from `MethodologyResource` that are currently absent from
`MethodologyProps`:

```ts
export interface MethodologyProps extends MethodologyDTO {
  id: number;
  is_default: boolean;
  teams: MethodologyTeam[];
  scheme: unknown | null; // add — returned by backend
  scheme_version: string | null; // add — returned by backend
}
```

### 3. `MethodologyItem` — add active/default badge

File: `features/methodology/ui/methodology-item.tsx`

Derive `isActive` and render badge inline with the methodology name:

```tsx
export default function MethodologyItem({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`;
  const isActive = methodology.teams.length > 0;

  return (
    <div className='border-b border-border'>
      <div className='py-6 flex items-center justify-between group'>
        <Link
          className='cursor-pointer flex-1 flex items-center gap-3'
          href={route}
        >
          <H3>{methodology.name}</H3>
          {methodology.is_default && <span className='...'>Default</span>}
          {isActive && !methodology.is_default && (
            <span className='...'>Active</span> // green badge
          )}
        </Link>
        <MethodologiesAction methodology={methodology} />
      </div>
    </div>
  );
}
```

Badge styles (Tailwind v4, consistent with the cosmic dark theme):

- **Active**:
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30`
- **Default**:
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground ring-1 ring-border`

### 4. Optional: team count tooltip / subtitle

Below or next to the badge, show which teams use the methodology (e.g., "Used by
Core Team, Sales Team"). This can be rendered as a `title` attribute on the
badge or as a secondary text line under the methodology name.

Example:

```tsx
{
  isActive && (
    <span title={methodology.teams.map((t) => t.name).join(', ')}>
      Active ({methodology.teams.length})
    </span>
  );
}
```

This is optional but improves discoverability without adding new API calls.

## Acceptance Criteria

- [ ] Methodology items with `teams.length > 0` display a green "Active" badge
      next to the name
- [ ] The default methodology (is_default=true) displays a "Default" badge
      (neutral color)
- [ ] Methodologies with no teams assigned show no badge
- [ ] Badge is visible in both light/dark modes, consistent with the design
      system
- [ ] No new API calls introduced — derived purely from existing `teams` field
- [ ] `MethodologyProps` type includes `scheme` and `scheme_version` fields
      (contract parity)
- [ ] Existing edit/delete actions are unaffected

## Files to Change

| File                                           | Change                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `features/methodology/model/types.ts`          | Add `scheme`, `scheme_version` fields to `MethodologyProps` |
| `features/methodology/ui/methodology-item.tsx` | Derive `isActive`, render Active/Default badges             |

No changes needed to:

- `features/methodology/api/methodology.ts` — `teams` already fetched
- `features/methodology/ui/methodology-list.tsx` — no change to list logic
- `app/dashboard/methodology/page.tsx` — server component, no change needed

## Edge Cases

- **All methodologies inactive**: User has created methodologies but hasn't
  assigned any teams yet — no Active badge shown anywhere. This is valid and
  expected.
- **is_default with teams**: The default methodology can have teams assigned to
  it (teams fall back to it on deletion of their custom methodology). Show both
  "Default" + "Active" badges, or combine into "Default (Active)".
- **Empty teams array**: Guard with `Array.isArray(methodology.teams)` in case
  the field is missing for legacy data.

## References

- Backend: `app/Http/Resources/API/v1/MethodologyResource.php` — `teams` field
- Backend: `app/Models/Methodology.php` — `teams()` HasMany relation
- Backend: `app/Models/Team.php` — `methodology()` BelongsTo relation
- Backend route: `GET teams/{team}/methodologies/active` — not needed for this
  feature
- Frontend: `features/methodology/ui/methodology-item.tsx`
- Frontend: `features/methodology/model/types.ts`
- Design system: `shared/ui/` badge patterns (check for existing Badge
  component)
