---
title: 'feat: Merge Teams Settings tab into People tab'
type: feat
status: completed
date: 2026-04-15
---

# feat: Merge Teams Settings Tab into People Tab

## Overview

On the Teams dashboard page, the **People** tab (analytics view) and the
**Settings** tab (member management + notifications) serve overlapping purposes
and force managers to switch between two tabs to do related work. This refactor
merges them into a single unified **People** tab containing all people-related
functionality: member analytics, live member list with management controls,
invite workflow (including pending invites), and team notification settings.

The Settings tab is removed from the tab strip entirely.

---

## Problem Statement

Currently the Teams dashboard has 6 tabs: Status, Readiness, **People**, Health,
Risks, **Settings**.

- **People tab** (`team-dashboard-tab-people.tsx`) — read-only analytics grid
  powered by `dashboard.tabs.people`. Shows per-member task counts and latest
  meeting reference. No management actions.
- **Settings tab** (`team-dashboard-tab-settings.tsx`) — live member management
  powered by `team.members[]`. Shows remove buttons, "Invite" button (opens
  modal → `sendInvite`), and `TeamNotificationSettings` CRUD.

The content overlap is high: both tabs display the team's members. A manager
adding a member and then checking their task stats must switch tabs repeatedly.
There is also no way to see or cancel **pending invites** (the backend endpoint
`GET /teams/{team}/invites` exists but has zero frontend implementation).

---

## Proposed Solution

Replace the two tabs with a single **People** tab that has three sections:

1. **Members** — unified member rows combining live member data with analytics
   data (task counts, latest meeting). Managers see remove buttons. All users
   see the analytics.
2. **Pending Invites** — manager-only section showing outstanding invitations
   with a cancel button per row. Hidden when empty or for non-managers.
3. **Notification Settings** — manager-only section for Telegram notification
   CRUD. Already implemented as `TeamNotificationSettings`, just moved here.

The Settings tab entry is deleted from `TABS` constant. `tab=settings` in URL is
silently redirected to `tab=people`.

---

## Technical Approach

### Architecture

**Data sources for the merged tab:**

| Data                                               | Source                                        | Currently fetched at                        |
| -------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| Analytics per member (task counts, latest meeting) | `dashboard.tabs.people.members` (`TabPeople`) | `getTeamDashboard()` in page.tsx            |
| Live member list (id, name, email)                 | `team.members[]` (`TeamProps.members`)        | `getTeam()` in page.tsx                     |
| Pending invites                                    | `GET /teams/{team}/invites`                   | **Not yet implemented**                     |
| Notification settings                              | `GET /teams/{team}/notification-settings`     | `getTeamNotificationSettings()` in page.tsx |
| Available Telegram chats                           | `GET /organizations/{org}/telegram/chats`     | already fetched in page.tsx                 |

**Viewer role signal:** `TeamDashboardData.viewer` currently only has
`{ id, name }` — no role. The backend `TeamResource` does include
`members[].role` (the org role pivot column). The safest frontend approach
without a backend change: find `viewer.id` in `team.members[]` and read their
`role`. Fall back to non-manager if viewer is not in the list.

> ⚠️ **Backend coordination needed:** Ideally request
> `viewer.is_manager: boolean` be added to the dashboard payload or
> `TeamResource`. Until then, use the `team.members` lookup fallback.

**Unified member row:** Merge `TabPeople.members` and `TeamProps.members` by
`id`. For each live member (`TeamProps.members`), look up matching analytics
entry in `TabPeople.members`. Show analytics fields where available, show `—`
where dashboard is null or member not found in analytics.

### Implementation Phases

#### Phase 1 — Backend type extension (Prerequisite)

- [x] Read `TeamInviteController@index` and `InviteResource` fields in backend
- [x] Add TypeScript type `TeamInvite` to `entities/team/model/types.ts`
- [x] Add Server Action `getTeamInvites(teamId)` to `features/teams/api/team.ts`
      using `httpClientList<TeamInvite>`
- [x] Add Server Action `cancelTeamInvite(teamId, inviteId)` returning
      `ActionResult<void>`

**Files:**

- `entities/team/model/types.ts` — add `TeamInvite` interface
- `features/teams/api/team.ts` — add `getTeamInvites`, `cancelTeamInvite`

#### Phase 2 — Shared utilities extraction

Before writing the merged component, extract duplicated code:

- [x] Create `features/teams/model/avatar-utils.ts` with
      `initials(name: string)` and `avatarColor(name: string)` helpers
      (currently duplicated verbatim in both `team-dashboard-tab-people.tsx` and
      `team-dashboard-tab-settings.tsx`)
- [x] Update both existing tab components to import from the new utility

**Files:**

- `features/teams/model/avatar-utils.ts` — new file
- `features/teams/ui/dashboard/team-dashboard-tab-people.tsx` — remove local
  helpers, import from model
- `features/teams/ui/dashboard/team-dashboard-tab-settings.tsx` — remove local
  helpers, import from model

#### Phase 3 — Build unified People tab component

Build the new `TeamDashboardTabPeople` (replace existing). It accepts:

```tsx
// features/teams/ui/dashboard/team-dashboard-tab-people.tsx
interface TeamDashboardTabPeopleProps {
  analyticsMembers: TabPeople['members'] | null; // from dashboard (nullable)
  members: TeamMember[]; // from team.members (live)
  pendingInvites: TeamInvite[];
  teamId: number;
  isManager: boolean;
  // passed through for notifications section
  notificationSettings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
}
```

**Section 1 — Members:**

- Render one row per `members[]` (live source of truth)
- For each member, merge analytics from `analyticsMembers` by `id`
- Show: avatar (initials + color), name, email, `open_tasks`, `done_tasks`,
  `overdue_tasks`, `latest_meeting.title`
- Manager-only: show remove button with confirmation dialog before calling
  `kickTeamMember`
- Manager-only: show "Invite" button in section header → opens
  `TeamMemberAddModal`
- Empty state: "No members yet." + "Invite" button for managers

**Section 2 — Pending Invites (manager-only, hidden when empty):**

- Render rows with: email, status badge, `expires_at`, cancel button
- Cancel → `cancelTeamInvite(teamId, invite.id)` → `revalidatePath`
- Only render section if `isManager && pendingInvites.length > 0`

**Section 3 — Notification Settings (manager-only):**

- Render existing `<TeamNotificationSettings>` component as-is
- Only render if `isManager`

**Files:**

- `features/teams/ui/dashboard/team-dashboard-tab-people.tsx` — full rewrite

#### Phase 4 — Update tab strip and routing

- [x] Open `features/teams/ui/dashboard/team-dashboard-tabs.tsx`
- [x] Remove `{ key: 'settings', label: 'Settings' }` from `TABS` const
- [x] In the tab key resolution logic (where tab is read from searchParams),
      add: if `tab === 'settings'`, treat as `'people'`
- [x] In the tab renderer (`switch` or conditional), remove the `settings` case
- [x] Delete `TeamDashboardTabSettings` render call

**Files:**

- `features/teams/ui/dashboard/team-dashboard-tabs.tsx` — remove settings tab,
  add redirect logic

#### Phase 5 — Page-level data fetching

- [x] Open `app/dashboard/teams/page.tsx`
- [x] Add `getTeamInvites(teamId)` call inside the existing `Promise.allSettled`
      block
- [x] Pass `pendingInvites` result down to the dashboard component tree
- [x] Pass `isManager` derived from viewer role check to the tab
- [x] Verify `notificationSettings` and `availableChats` are already fetched
      (they are) and threaded correctly

**Files:**

- `app/dashboard/teams/page.tsx` — add invite fetch, pass isManager

#### Phase 6 — Delete Settings tab component

- [x] Delete `features/teams/ui/dashboard/team-dashboard-tab-settings.tsx`
      entirely (functionality fully moved to unified People tab)
- [x] Remove import from wherever it is imported

**Files:**

- `features/teams/ui/dashboard/team-dashboard-tab-settings.tsx` — delete

---

## Key Files

| File                                                          | Action                                              |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `entities/team/model/types.ts`                                | Add `TeamInvite` interface                          |
| `features/teams/api/team.ts`                                  | Add `getTeamInvites`, `cancelTeamInvite`            |
| `features/teams/model/avatar-utils.ts`                        | New: extract `initials`, `avatarColor` helpers      |
| `features/teams/ui/dashboard/team-dashboard-tab-people.tsx`   | Full rewrite — unified People tab                   |
| `features/teams/ui/dashboard/team-dashboard-tab-settings.tsx` | Delete                                              |
| `features/teams/ui/dashboard/team-dashboard-tabs.tsx`         | Remove Settings tab, add `settings→people` redirect |
| `app/dashboard/teams/page.tsx`                                | Add invite fetch, derive `isManager`, pass props    |

---

## Acceptance Criteria

### Functional Requirements

- [ ] The Teams dashboard tab strip shows **5 tabs** (Status, Readiness, People,
      Health, Risks) — no Settings tab
- [ ] Navigating to `?tab=settings` silently redirects to `?tab=people`
- [ ] People tab — Member section: shows all live team members with name, email,
      avatar
- [ ] People tab — Member section: shows analytics data (open/done/overdue
      tasks, latest meeting) when dashboard is available; shows `—` placeholders
      when dashboard is null
- [ ] People tab — Manager controls: remove button visible only to managers;
      clicking remove shows a confirmation dialog before executing
      `kickTeamMember`
- [ ] People tab — Manager controls: "Invite" button visible only to managers;
      opens existing `TeamMemberAddModal`; on success the new invite appears in
      Pending Invites
- [ ] People tab — Pending Invites: shown only to managers; lists all pending
      invites with email, status, expiry; each row has a cancel button
- [ ] People tab — Notification Settings: shown only to managers; full CRUD
      (same as current Settings tab)
- [ ] Non-manager team members see only the member list (read-only analytics
      view); no remove, invite, pending invites, or notification sections
- [ ] All sections render correctly when `dashboard` payload is null (new team
      with no meetings)
- [ ] Empty state: "No members yet" shown when `team.members` is empty; invite
      button still visible to managers

### Non-Functional Requirements

- [ ] No TypeScript `any` — all new types derived from backend Resource classes
- [ ] `httpClient` / `httpClientList` used for new Server Actions (no raw
      `fetch`)
- [ ] `revalidatePath('/dashboard/teams')` called after `cancelTeamInvite` and
      `kickTeamMember`
- [ ] No ESLint errors (run `npm run lint` after implementation)

### Quality Gates

- [ ] `fsd-boundary-guard` agent passes — no cross-feature imports introduced
- [ ] `mr-reviewer` agent passes before push

---

## Open Questions (Resolve Before Implementing)

1. **Viewer role signal** — Should the backend add `viewer.is_manager: boolean`
   to the `TeamDashboardResource` or `TeamResource`? Without it, the frontend
   must look up the viewer in `team.members[]` and read their `role` — this
   fails for org managers who are not explicit team members.

2. **Unified member row vs. two sections** — Should the analytics data and live
   member list be merged into single rows (one row per member with both
   analytics + management actions), or shown as two separate visual sections
   (analytics cards at top, management list below)? This plan assumes **unified
   rows** (live list is the base, analytics overlaid). If two-section layout is
   preferred, component structure changes significantly.

3. **Pending invites scope** — Should pending invites be included in this PR, or
   deferred to a follow-up? Adding them requires new TypeScript types, two new
   Server Actions, and a new UI section. Excluding them means the invite flow
   still lacks visibility into outstanding invitations (the
   `INVITE_ALREADY_EXISTS` error is the only signal).

4. **Confirmation dialog for member removal** — Should `kickTeamMember` require
   a "Are you sure?" confirmation, or is immediate action + success toast
   sufficient?

---

## Dependencies & Risks

| Risk                                                                  | Mitigation                                                                                                  |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `viewer.is_manager` not available without backend change              | Use `team.members` lookup as fallback; document the edge case in code comments                              |
| `TeamMemberAddForm` reads `team_id` from URL (fragile)                | Do not refactor this coupling in this PR — it works with current query-param URL scheme; add a TODO comment |
| `tab=settings` deep links break silently                              | Add fallback redirect in tab resolution logic (Phase 4)                                                     |
| Analytics and live member lists out of sync (race condition on fetch) | Accept stale analytics gracefully by showing `—` when member not found in analytics data                    |
| Pending invites fetch adds latency to page load                       | Use `Promise.allSettled` — non-blocking; failure shows empty pending invites list                           |
| Duplicate `initials`/`avatarColor` logic triplicated across files     | Phase 2 extracts to shared utility before writing new component                                             |

---

## References & Research

### Internal References

- **People tab component (current):**
  `features/teams/ui/dashboard/team-dashboard-tab-people.tsx`
- **Settings tab component (to delete):**
  `features/teams/ui/dashboard/team-dashboard-tab-settings.tsx`
- **Tab strip (to modify):**
  `features/teams/ui/dashboard/team-dashboard-tabs.tsx`
- **Page-level fetch orchestration:** `app/dashboard/teams/page.tsx`
- **Existing invite Server Action:** `features/teams/api/team.ts` — `sendInvite`
- **Notification settings Server Actions:**
  `features/teams/api/notification-settings.ts`
- **Notification settings UI component:**
  `features/teams/ui/team-notification-settings.tsx`
- **Member invite modal:** `features/teams/ui/team-member-add-modal.tsx`,
  `team-member-add-form.tsx`
- **Domain types:** `entities/team/model/types.ts`
- **Dashboard types:** `features/teams/model/dashboard-types.ts` — `TabPeople`
- **Routes:** `shared/lib/routes.ts` — `ROUTES.DASHBOARD.TEAMS`

### Backend References

- `GET /teams/{team}/invites` → `TeamInviteController@index` → `InviteResource`
- `DELETE /teams/{team}/invites/{invite}` → `TeamInviteController@destroy`
- Error codes: `USER_ALREADY_IN_TEAM`, `INVITE_ALREADY_EXISTS`,
  `INVITE_ALREADY_ACCEPTED`
- Backend path:
  `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Controllers/API/v1/TeamInviteController.php`

### Related Plans

- `docs/plans/2026-04-13-refactor-teams-single-page-selector-plan.md` — teams
  single-page refactor (Phase 1: tab param fix already done)
- `docs/plans/2026-04-15-fix-team-invitation-email-not-sent-plan.md` — invite
  email delivery fix (queue worker + Unisender API key)
