---
title: 'refactor: Decisions page cleanup + remove Telegram decision followup'
type: refactor
status: completed
date: 2026-04-30
---

# refactor: Decisions page cleanup + remove Telegram decision followup

## Overview

Three focused changes:

1. **Frontend** — remove the Key Points section from `DecisionsPage`
2. **Frontend** — rename the "Key Point" column → "Decision" and remove the
   "Decision" text column; clicking a row opens a detail modal
3. **Backend** — disable the Telegram notification job that fires after a
   meeting for decisions without linked tasks; keep DB writes and frontend
   display intact

---

## Change 1 — Remove Key Points section from DecisionsPage

**File:** `features/decisions/ui/decisions-page.tsx`

**What to remove:**

- The `keyPoints` / `totalKeyPoints` state (lines 33–34)
- The `getKeyPoints` import (line 8)
- The `KeyPointsTable` import (line 11)
- The `getKeyPoints` call inside `loadInitial` (line 50)
- The entire `{/* Key Points section */}` JSX block (lines 176–184)
- The `keyPoints.length` check from `isEmpty` (line 125 — simplify to
  `decisions.length === 0`)
- The `search` placeholder text can be simplified from "Search decisions and key
  points…" → "Search decisions…"

**What stays:** all decision loading, infinite scroll, `AddDecisionModal`,
toolbar, search.

**After removal**, `loadInitial` just calls `getDecisions`. The `isEmpty` state
becomes `decisions.length === 0`.

---

## Change 2 — Rework DecisionsTable: rename column + row-click detail modal

### 2a. decisions-table.tsx — column changes

**File:** `features/decisions/ui/decisions-table.tsx`

| Before                                      | After                                                             |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Column "Key Point" (shows `decision.topic`) | Column "Decision" (shows `decision.topic` — same data)            |
| Column "Decision" (shows `decision.text`)   | **Removed**                                                       |
| Row is not clickable                        | Row is clickable (`cursor-pointer`), calls `onRowClick(decision)` |

New `Props` interface:

```tsx
interface Props {
  decisions: Decision[];
  onRowClick: (decision: Decision) => void;
}
```

The `<tr>` gets `onClick={() => onRowClick(decision)}` and `cursor-pointer`
class.

Column header "Key Point" → "Decision". Remove the `<th>` and `<td>` for the old
"Decision" column entirely.

### 2b. New modal — DecisionDetailModal

**New file:** `features/decisions/ui/decision-detail-modal.tsx`

A dialog (reuse whatever modal primitive the project uses — same pattern as
`add-decision-modal.tsx` which uses a `<dialog>` or the shared `Modal`
component) showing:

```
Decision
────────
<decision.text>  (full, not line-clamped)

Topic
──────
<decision.topic ?? "—">

Event
──────
<Calendar icon> <decision.calendar_event.title ?? "—">

Date
──────
<formatted date>

Source
──────
<DecisionSourceBadge />

Linked Issues
──────────────
<list of decision.issues or "None">
```

Props:

```tsx
interface Props {
  decision: Decision | null; // null → modal closed
  onClose: () => void;
}
```

Render `null` when `decision` is null. No API calls needed — all data is already
in the `Decision` object.

### 2c. Wire modal into DecisionsPage

**File:** `features/decisions/ui/decisions-page.tsx`

- Add
  `const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null)`
- Pass `onRowClick={setSelectedDecision}` to `<DecisionsTable>`
- Render
  `<DecisionDetailModal decision={selectedDecision} onClose={() => setSelectedDecision(null)} />`

---

## Change 3 — Disable Telegram decision followup notification (backend)

**Goal:** decisions are still written to DB and shown in frontend. Only the
Telegram ping ("Под него пока нет связанных задач. Кто возьмётся?") is removed.

### Option A — Disable the scheduled job (recommended, safest)

**File:** `app/Console/Kernel.php` (or wherever `SendDecisionFollowupsJob` is
scheduled)

Remove or comment out the `->schedule(SendDecisionFollowupsJob::class, ...)`
call. The job class and `DecisionFollowupNotifier` remain untouched — easy to
re-enable.

Find the schedule registration:

```bash
grep -r "SendDecisionFollowupsJob" /Users/slavapopov/Documents/WandaAsk_backend/app/Console/
```

### Option B — Add a feature flag in config

Add to `config/decisions.php`:

```php
'followup' => [
    'delay_minutes' => env('DECISIONS_FOLLOWUP_DELAY_MINUTES', 120),
    'telegram_enabled' => env('DECISIONS_FOLLOWUP_TELEGRAM_ENABLED', false),
],
```

In `SendDecisionFollowupsJob::handle()`:

```php
if (! config('decisions.followup.telegram_enabled')) {
    return;
}
```

This keeps the job scheduled but silently exits. Set
`DECISIONS_FOLLOWUP_TELEGRAM_ENABLED=false` in `.env`.

**Option A is recommended** — simpler, no config drift.

---

## Acceptance Criteria

- [ ] Key Points section (`<KeyPointsTable>`) is completely gone from the
      decisions page; no data is fetched for key points
- [ ] `DecisionsTable` has columns: **Decision** (was "Key Point"), **Event**,
      **Date**, **Source** — no "Decision text" column
- [ ] Clicking any row in `DecisionsTable` opens `DecisionDetailModal` with the
      full decision details
- [ ] `DecisionDetailModal` shows: full text, topic, event, date, source, linked
      issues
- [ ] `DecisionDetailModal` closes via ESC key and a close button
- [ ] No Telegram message is sent after meetings for decisions without linked
      tasks
- [ ] Decisions are still saved to the database by existing meeting summary
      logic (not touched)
- [ ] Decisions page still displays correctly at `/dashboard/decisions`
- [ ] TypeScript strict-mode passes, no `any`
- [ ] `npm run lint` passes

---

## Files to Touch

### Frontend

| File                                              | Action                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `features/decisions/ui/decisions-page.tsx`        | Remove Key Points imports, state, fetch, JSX; add `selectedDecision` state; wire modal |
| `features/decisions/ui/decisions-table.tsx`       | Rename column, remove Decision text column, add `onRowClick` prop                      |
| `features/decisions/ui/decision-detail-modal.tsx` | **Create new**                                                                         |
| `features/decisions/index.ts`                     | Export `DecisionDetailModal` if needed                                                 |

### Backend

| File                                             | Action                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| `app/Console/Kernel.php` (or routes/console.php) | Remove / comment `SendDecisionFollowupsJob` schedule |

### Files NOT touched

- `features/decisions/api/decisions.ts` — no change
- `features/decisions/api/key-points.ts` — no change (used elsewhere
  potentially)
- `features/decisions/ui/key-points-table.tsx` — no change (keep file, just stop
  using it in DecisionsPage)
- `app/Services/Decisions/DecisionFollowupNotifier.php` — no change
- `app/Jobs/SendDecisionFollowupsJob.php` — no change
- Any meeting summary / decision extraction logic — no change

---

## References

- `features/decisions/ui/decisions-page.tsx` — Key Points section lines 176–184
- `features/decisions/ui/decisions-table.tsx` — "Key Point" column line 26,
  "Decision" column line 28
- `features/decisions/model/types.ts` — `Decision` interface (has `text`,
  `topic`, `issues`, `calendar_event`)
- `features/decisions/ui/add-decision-modal.tsx` — modal pattern to follow for
  `DecisionDetailModal`
- `app/Jobs/SendDecisionFollowupsJob.php` — the job to disable
- `app/Services/Decisions/DecisionFollowupNotifier.php` — the notifier (keep,
  just stop calling it)
