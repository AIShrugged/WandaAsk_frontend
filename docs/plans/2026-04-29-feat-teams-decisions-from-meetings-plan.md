---
title: Teams Decisions — Import from Meeting Summaries & AI Chat Context
type: feat
status: active
date: 2026-04-29
---

# Teams Decisions — Import from Meeting Summaries & AI Chat Context

## Overview

The `/dashboard/teams?team_id=1&tab=decisions` page currently shows decisions
stored in the team's Decision entity (auto-extracted from meeting summaries via
`ExtractDecisionsService` or created manually). The request is to:

1. **Enrich the Decisions tab UI** — surface meeting context (which meeting,
   which people) alongside each decision, grouped by date
2. **Ensure meeting-extracted decisions flow correctly** — verify the
   auto-extraction pipeline surfaces all decisions from the today-briefing's
   `summary.decisions[]` correctly into the team's Decision table
3. **AI Chat awareness** — the chat agent must be able to answer questions like
   "Why did we choose microservices for the notifications module?" by
   referencing stored decisions with their meeting context (title, date,
   attendees)
4. **Transcript drill-down** — when a user asks follow-up questions about a
   specific decision, the AI must check the meeting transcript

## Problem Statement

### Current state

- The **Decisions tab** (`features/decisions/ui/decisions-page.tsx`) renders a
  generic paginated list. Cards show decision text + topic but the meeting
  context (`calendar_event.title`, `calendar_event.starts_at`, attendees) is not
  prominently displayed or grouped by date.
- The **AI chat** receives the page's rendered HTML as context
  (`chat-window.tsx` serializes `document.documentElement.outerHTML`). If the
  decisions page doesn't render meeting context, the AI has no way to answer
  "when and where was this decided and by whom".
- **Source types**: `source_type: 'meeting'` decisions already exist — they are
  auto-extracted asynchronously by `ExtractDecisionsService` after each meeting
  summary is generated. No new API endpoint is needed.
- **Date range filtering** is not supported by the backend
  `GET /api/v1/teams/{team}/decisions` endpoint — only `source_type`, `search`,
  `offset`, `limit`. Date grouping must be done client-side.

### Gap

The decisions page does NOT:

- Group decisions by date
- Show which meeting the decision came from
- Show who was present in that meeting
- Give the AI enough structured context to answer "why" questions about
  decisions
- Link to the meeting transcript for drill-down

## Proposed Solution

### Phase 1 — Enrich the Decision Card UI

Update `features/decisions/ui/decision-card.tsx` to display:

- Meeting title + date (from `calendar_event.title` +
  `calendar_event.starts_at`) when `source_type === 'meeting'`
- Attendees list — requires a backend change or a secondary fetch (see Backend
  Changes below)
- A link to `/dashboard/calendar?event_id=<id>` or `/dashboard/today/meetings`
  for the meeting

Update `features/decisions/ui/decisions-page.tsx` to:

- Group the decision list by date (using `calendar_event.starts_at` for meeting
  decisions, `created_at` for manual decisions)
- Render date section headers: `"April 28, 2026"` → list of decisions from that
  date

### Phase 2 — Backend: Expose Attendees on DecisionResource

Currently `DecisionResource` includes `calendar_event.title` and
`calendar_event.starts_at` but NOT the attendee list. The backend team needs to
add eager loading of attendees.

**Backend change needed** (out of scope for frontend alone):

- In `TeamDecisionController::index()`, add
  `with(['calendarEvent.participants' => ...])` or include attendee names from
  the meeting summary
- Add `attendees: string[]` (names) to `DecisionResource`

**Frontend workaround if backend is not updated**: For decisions with
`calendar_event_id`, optionally fetch attendee info from
`GET /api/v1/calendar-events/{id}` on card expand — lazy-loaded on user
interaction.

### Phase 3 — Date-based View from Today's Briefing

Add an optional `date` filter to the decisions page UI:

```
GET /api/v1/teams/{team}/decisions?source_type=meeting&limit=50
```

Then group client-side by `calendar_event.starts_at` date. The Today > Meetings
page already fetches `GET /api/v1/me/today?date=2026-04-28` and shows
`summary.decisions[]` as plain strings. The Decisions tab shows the same
decisions as persisted `Decision` entities (auto-extracted by the backend).

Add a date picker / date filter on the Decisions tab so users can navigate to
"decisions from a specific date".

### Phase 4 — AI Chat Context Enhancement

The AI chat already receives `document.outerHTML` as context. The fix is: make
the Decisions page render enough structured data in the DOM so the AI can read
it.

**Specifically**, each decision card should render:

- `data-meeting-id`, `data-meeting-title`, `data-meeting-date` attributes (or
  just visible text)
- Attendee names
- Decision text

This way when a user asks "Why did we choose microservices?" in the chat:

1. The AI reads the decisions list from the page HTML context
2. Finds the matching decision + meeting metadata
3. Can reference "This was decided in the [Meeting Title] on [Date] with
   [Attendees]"
4. For deeper context, the AI can call the `get_meeting_summary` or
   `get_transcript` MCP tool (backend MCP already has this capability)

**No frontend code change needed for the AI tool call** — the backend agent
handles that. The frontend only needs to render rich enough DOM.

### Phase 5 — Telegram / Admin Chat (AI assistant context)

When a user asks "Why did we abandon vectorization?" in TG/admin chat, the AI
agent (backend) must:

1. Query team decisions by keyword (`search=vectorization`)
2. Return the matching decision with meeting context
3. If the user asks for more detail → fetch the transcript via `get_transcript`
   MCP tool

This is **entirely a backend AI agent prompt / tool-use change** — no frontend
work. Document the expectation here so the backend team knows what the frontend
exposes.

## Technical Considerations

### Architecture

- `features/decisions/ui/decisions-page.tsx` — add date grouping logic (pure JS,
  `groupBy(decisions, d => formatDate(d.calendar_event?.starts_at ?? d.created_at))`)
- `features/decisions/ui/decision-card.tsx` — add meeting badge, attendee chips
- `features/decisions/model/types.ts` — extend `Decision.calendar_event` to
  include `attendees?: string[]` when backend adds it
- `features/decisions/api/decisions.ts` — no changes needed; existing
  `getDecisions` action already fetches with `calendar_event` loaded

### Date Grouping

```ts
// features/decisions/ui/decisions-page.tsx
import { groupBy } from '@/shared/lib/utils';

const grouped = groupBy(decisions, (d) => {
  const date = d.calendar_event?.starts_at ?? d.created_at;
  return formatDate(date, 'yyyy-MM-dd');
});
```

Render as:

```
April 28, 2026
  [Decision card] We chose microservices → Scrum Review • 14:00 • Ivan, Anna, Slava
  [Decision card] Migrate to PostgreSQL → Architecture Sync • 11:00 • Ivan, Slava

April 21, 2026
  [Decision card] ...
```

### Backend Summary → Decisions Sync

The auto-extraction flow already exists:

1. Meeting ends → backend generates `MeetingSummary`
2. `ExtractDecisionsService::extract()` is called async
3. Decisions are persisted with `source_type=meeting`, `calendar_event_id`,
   `summary_id`

**What could be missing:** If a meeting happened on 2026-04-28 but the team for
that meeting is not set (or the `calendar_event` is not linked to a team), the
decision won't appear in the team's Decisions tab. Verify that `team_id` is set
correctly during extraction.

This verification is a backend concern; frontend cannot fix it.

### Attendees — Fallback Strategy

Until the backend adds attendees to `DecisionResource`:

1. Show `author.name` (the person who created/accepted the decision) on the card
2. Show meeting title + date as a clickable link
3. On card expand (if needed), lazily fetch attendees from
   `GET /api/v1/calendar-events/{id}`

## Acceptance Criteria

### Functional

- [ ] Decisions tab groups decisions by date (section header per date,
      descending)
- [ ] Each decision card shows: decision text, topic, meeting title, meeting
      date/time (when `source_type=meeting`)
- [ ] Each decision card shows at least the author name; attendees shown if
      backend provides them
- [ ] Date filter on Decisions tab allows navigating to a specific date
- [ ] AI chat can answer "Why did we choose X?" by reading the DOM-rendered
      decision context (meeting title, date)
- [ ] Meeting decisions sourced from 2026-04-28 briefing appear in the Decisions
      tab (verify sync is working)

### Non-functional

- [ ] Decision list grouped client-side — no new API endpoint required
- [ ] All UI text in English (not Russian) per project convention
- [ ] Decision cards follow existing design system (cosmic dark theme, violet
      primary)
- [ ] `source_type=manual` decisions still shown, grouped by `created_at` date

### Out of Scope (Backend Only)

- [ ] Backend: Add `attendees` field to `DecisionResource`
- [ ] Backend: AI agent prompt tuning to answer "why" questions using the
      `search_meetings` + `get_transcript` MCP tools
- [ ] Backend: `POST /api/v1/teams/{team}/decisions` does not need to change
      (manual creation stays manual)

## Dependencies & Risks

| Dependency                                          | Risk                                 | Mitigation                                                           |
| --------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `calendar_event` eager loaded in `DecisionResource` | Already included per research        | Verify by running `source_type=meeting` filter and checking response |
| Attendees in `DecisionResource`                     | Not currently included               | Use author name + lazy-fetch as fallback                             |
| `ExtractDecisionsService` correctly links `team_id` | Unknown — needs backend verification | Check if today's meeting decisions appear in team's list             |
| AI chat answering "why" questions                   | Depends on rich DOM rendering        | Render meeting title + date as visible text on decision cards        |

## Implementation Files

### Modified Files

```
features/decisions/ui/decision-card.tsx
  — Add: meeting badge (title + date + time)
  — Add: author/attendee chips
  — Add: data-* attributes for AI context

features/decisions/ui/decisions-page.tsx
  — Add: groupBy date logic
  — Add: date section headers
  — Add: date filter UI (optional date picker)

features/decisions/model/types.ts
  — Extend: Decision.calendar_event to include attendees?: string[] (when backend ready)
```

### No Change Needed

```
features/decisions/api/decisions.ts       — API already fetches with calendar_event
features/chat/ui/chat-window.tsx          — Already sends outerHTML as context
features/today-briefing/                  — Today briefing is a separate read path
app/dashboard/teams/page.tsx              — SSR entry point, no change needed
```

## References

### Internal Code

- Decision TypeScript type: `features/decisions/model/types.ts`
- Decision server actions: `features/decisions/api/decisions.ts`
- Decision list page: `features/decisions/ui/decisions-page.tsx:1`
- Decision card: `features/decisions/ui/decision-card.tsx:1`
- Teams tab strip: `features/teams/ui/dashboard/team-dashboard-tabs.tsx`
- Today briefing API: `features/today-briefing/api/today.ts`
- Meeting detail card (shows summary.decisions):
  `features/today-briefing/ui/meeting-detail-card.tsx`
- Chat window (page context): `features/chat/ui/chat-window.tsx`

### Backend

- Decision controller: `TeamDecisionController.php` — index, store
- Decision resource: `DecisionResource.php` — includes `calendar_event` when
  loaded
- Auto-extraction service: `ExtractDecisionsService.php`
- Backend MCP tools: `get_meeting_summary`, `get_transcript`, `search_meetings`

### API Endpoints Used

| Endpoint                                                 | Purpose                              |
| -------------------------------------------------------- | ------------------------------------ |
| `GET /api/v1/teams/{team}/decisions?source_type=meeting` | Fetch meeting-sourced decisions      |
| `GET /api/v1/me/today?date=YYYY-MM-DD`                   | Today briefing (for cross-reference) |
| `GET /api/v1/calendar-events/{id}`                       | Lazy-fetch attendees (fallback)      |
