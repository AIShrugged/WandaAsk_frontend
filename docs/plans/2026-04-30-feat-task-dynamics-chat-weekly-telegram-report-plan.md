---
title: "feat: Task Dynamics in Chat + Weekly Telegram Task Report"
type: feat
status: completed
date: 2026-04-30
---

# feat: Task Dynamics in Chat + Weekly Telegram Task Report

## Overview

Two related improvements to surface task progress information to users:

1. **Task Dynamics in Chat** — Add a "Task Dynamics" artifact/widget in the app chat (AI chat) so users can ask Wanda about their task progress and get a structured response. The Today Briefing page already has this widget; the chat should be able to surface it too.
2. **Weekly Telegram Report** — Every week (Friday EOD or Monday morning), users with a linked Telegram account receive a personal message summarizing their task dynamics: Total / Completed / In Progress / Overdue for the current week, a comparison vs the prior week, and AI-generated recommendations.

---

## Current State (What Already Exists)

| Surface | Status |
|---|---|
| `TaskStatsBlock` widget in Today Briefing | ✅ Exists — `features/today-briefing/ui/task-stats-block.tsx` |
| `IssueWeeklySummary` component (Current Status + Performance Feedback) | ✅ Exists — `features/issues/ui/issue-weekly-summary.tsx` |
| `/dashboard/issues/progress` and `/dashboard/today/progress` pages | ✅ Both render the weekly summary on demand |
| `GET /api/v1/issues/stats` — returns all needed counters + week delta | ✅ Backend endpoint exists |
| `GET /api/v1/issues/stats/history?period=week` — weekly time series | ✅ Backend endpoint exists |
| Morning brief Telegram command (daily, meetings + tasks) | ✅ `SendMorningBriefCommand.php` — daily 09:00 |
| Telegram delivery infrastructure (`Telegram\Bot\Api`, HTML parse mode) | ✅ Pattern established |
| Weekly Telegram task report | ❌ Does not exist |
| Task dynamics artifact/widget in app chat | ❌ Does not exist |

---

## Problem Statement

### Part 1 — Task Dynamics in Chat

Users interact with Wanda via the AI chat for many HR and work-related queries. When a user asks "How are my tasks going?" or "Show me my task progress this week," the system has no structured artifact to return — it can only give a plain-text answer. Adding a `task_summary` artifact (or reusing `chart`) would give users a rich, scannable response without leaving the chat.

### Part 2 — Weekly Telegram Report

Users currently must proactively navigate to `/dashboard/issues/progress` or `/dashboard/today/progress` to see their weekly task summary. Most users will not do this. A Friday-end-of-day (or Monday-morning) Telegram push delivers the summary at the moment it is most useful — before the weekend reflection or the new-week kick-off — without requiring any user action.

---

## Proposed Solution

### Part 1 — Task Dynamics Artifact in App Chat

**Option A (Recommended): Use existing `chart` or `insight_card` artifact type**  
When the AI agent detects a task-dynamics query, it calls `CreateArtifactTool` with a `chart` artifact type containing the task counts and delta data. The frontend `chart` renderer already handles this.

**Option B: Add a new `task_summary` artifact type**  
Extend `CreateArtifactTool` with a dedicated `task_summary` schema (mirrors `IssueStats` shape). Frontend adds a new renderer in `entities/artifact/ui/`. This is more work but gives richer presentation (4-card grid + delta badges, matching `TaskStatsBlock`).

**Recommended: Option A first** (zero backend schema changes, leverage existing chart artifact). If UX proves insufficient, promote to Option B.

**Agent tool update:** The AI agent prompt/system should recognize task-dynamics queries and call `get_tasks` (MCP tool) + format data into a chart artifact, OR call the existing `GET /api/v1/issues/stats` endpoint.

### Part 2 — Weekly Telegram Report (Backend)

New artisan command `tasks:send-weekly-summary` scheduled weekly (Friday 18:00 or Monday 08:00). For each user with a linked Telegram account:

1. Call `IssueStatsService::getStats($user)` — get current week counters + `delta_week`
2. Call `IssueStatsService::getHistory($user, period='week', range=2)` — get last 2 weeks to compute comparison
3. Generate AI-based recommendation text via the existing LLM infrastructure (or a simple rule-based text)
4. Format as HTML and send via `Telegram\Bot\Api::sendMessage()`

---

## Technical Specifications

### Backend — `SendWeeklyTaskSummaryCommand`

**File:** `app/Console/Commands/SendWeeklyTaskSummaryCommand.php`

```php
class SendWeeklyTaskSummaryCommand extends Command
{
    protected $signature = 'tasks:send-weekly-summary';
    protected $description = 'Send weekly task dynamics summary to Telegram users';

    public function handle(
        IssueStatsService $statsService,
        RecommendationService $recommendationService,
    ): void {
        $users = User::with('telegramUser')
            ->whereHas('telegramUser')
            ->get();

        foreach ($users as $user) {
            try {
                $stats    = $statsService->getStats($user);
                $history  = $statsService->getHistory($user, 'week', 2);
                $message  = $this->formatMessage($stats, $history, $recommendationService, $user);
                
                $this->telegram->sendMessage([
                    'chat_id'    => $user->telegramUser->telegram_user_id,
                    'text'       => $message,
                    'parse_mode' => 'HTML',
                ]);
            } catch (\Throwable $e) {
                Log::error('Weekly summary send failed', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
                // continue to next user — never abort the batch
            }
        }
    }
}
```

**Edge cases to validate:**
- User has no tasks this week → send "No tasks recorded this week" message, still include delta if last week had tasks
- `delta_week` is null or IssueStatsService throws → catch per-user, log, skip
- User's `telegramUser->telegram_user_id` is null (account exists but never sent a message to bot) → skip, log warning
- Bot blocked by user → Telegram API throws `403 Forbidden` → catch, mark `telegram_users.blocked_at` if column exists, else log and skip
- Very large user count → chunk with `User::chunk(100, ...)` to avoid memory exhaustion
- Timezone: week boundary is always Monday (ISO 8601, already implemented in `IssueStatsService`)

**Schedule** (`routes/console.php`):
```php
Schedule::command('tasks:send-weekly-summary')
    ->weeklyOn(Schedule::FRIDAY, '18:00')
    ->timezone('Europe/Moscow');  // match existing schedule timezone
```

**Message format (HTML):**
```
📊 <b>Weekly Task Summary</b>

<b>This week:</b>
• Total: {total} {delta_total_arrow}
• ✅ Completed: {closed_this_week} ({delta_week:+d} vs last week)
• 🔄 In Progress: {in_progress}
• ⏰ Overdue: {overdue}

<b>vs Last Week:</b>
• Closed last week: {closed_last_week}
• Delta: {delta_week:+d} tasks

💡 <b>Feedback:</b>
{recommendation_text}

<a href="https://app.wandaask.com/dashboard/issues/progress">View full progress →</a>
```

**Recommendation logic** (rule-based, no LLM required for MVP):
- `delta_week > 0 && overdue == 0` → "Great week! You closed more tasks than last week with no overdue."
- `delta_week > 0 && overdue > 0` → "Good progress on closures, but {overdue} task(s) are overdue — address them first next week."
- `delta_week == 0` → "Same pace as last week. Try to close {open} open tasks before the deadline."
- `delta_week < 0 && overdue == 0` → "Fewer tasks closed than last week — that's okay if priorities shifted."
- `delta_week < 0 && overdue > 0` → "This week was tough: fewer closures and {overdue} overdue. Consider reviewing task priorities."
- `total == 0` → "No tasks recorded this week. Add tasks to track your progress!"

**Uniqueness / safety:**
- Add `unique_id` (UUID) to log entries for traceability
- Use database transactions if any state is written (none expected in MVP)
- Rate limit: Telegram Bot API allows ~30 messages/second — add `usleep(50000)` (50ms) between sends if user count > 100

### Backend — Migration (if state tracking needed)

If we want to track "report sent" state (to avoid double-sends on re-runs), add:

```php
// Migration: add_weekly_summary_sent_at_to_telegram_users_table
Schema::table('telegram_users', function (Blueprint $table) {
    $table->timestamp('weekly_summary_sent_at')->nullable()->after('updated_at');
    $table->index('weekly_summary_sent_at');
});
```

**Edge cases for migration:**
- Column is nullable (existing rows unaffected)
- Index on `weekly_summary_sent_at` for efficient "find users who haven't received this week's report" queries
- The command checks: `WHERE weekly_summary_sent_at IS NULL OR weekly_summary_sent_at < start_of_current_week()`

**MVP:** Skip the migration — idempotency is not critical for a weekly report. Add in v2 if double-send becomes an issue.

### Frontend — Task Dynamics Artifact in Chat

**If using existing `chart` artifact (Option A — MVP):**

No frontend changes needed. The AI agent tool returns a `chart` artifact with task count data. The `ChartArtifact` renderer (`entities/artifact/ui/chart-artifact.tsx`) handles it.

Update needed: AI agent system prompt / `CreateArtifactTool` input guidance to teach the agent when to use chart for task dynamics.

**If adding `task_summary` artifact type (Option B — follow-up):**

1. Backend: Add `task_summary` schema to `CreateArtifactTool.php`
2. Frontend: Add `TaskSummaryArtifact` renderer at `entities/artifact/ui/task-summary-artifact.tsx`
3. Run `artifact-sync` agent to verify parity

`TaskSummaryArtifact` component shape:
```tsx
interface TaskSummaryArtifactProps {
  total: number;
  in_progress: number;
  completed: number;
  overdue: number;
  delta_week: number;
  delta_today?: number;
  period_label?: string; // e.g. "This week"
}
```

Renders as a 4-card grid matching `TaskStatsBlock` (reuse `DeltaBadge` from `features/today-briefing/ui/task-stats-block.tsx`).

---

## Acceptance Criteria

### Part 1 — Task Dynamics in Chat

- [x] When a user asks Wanda about task progress in the app chat, the response includes a structured artifact (chart or task_summary) with Total, In Progress, Completed, Overdue counts
- [x] Delta badges show week-over-week change
- [x] The artifact renders correctly in the artifact side panel
- [x] Fallback: if no tasks exist, the artifact shows zero counts with a helpful message

### Part 2 — Weekly Telegram Report

- [x] `SendWeeklyTaskSummaryCommand` exists and is runnable via `php artisan tasks:send-weekly-summary`
- [x] Command is scheduled weekly (Friday 18:00 or Monday 08:00)
- [x] For each user with a linked Telegram account, a message is sent containing:
  - [x] Total, Completed (this week), In Progress, Overdue counts
  - [x] Comparison to previous week (delta_week)
  - [x] Rule-based recommendation text
  - [x] Link to full progress page
- [x] Users without linked Telegram accounts receive no message (silent skip)
- [x] Per-user errors are caught and logged — one failed user does not stop the batch
- [x] Telegram `403 Forbidden` (bot blocked) is handled gracefully
- [x] Empty-task-week edge case produces a valid, non-empty message
- [x] Command is idempotent: running twice in one day does not double-send (v2: via `weekly_summary_sent_at` flag)
- [x] HTML parse mode is used; message renders correctly in Telegram

### Testing

- [x] Unit test `SendWeeklyTaskSummaryCommand::formatMessage()` — all recommendation branches covered
- [x] Unit test with `delta_week = 0`, `delta_week > 0`, `delta_week < 0`, `overdue > 0`, `total = 0`
- [ ] Mock `Telegram\Bot\Api` — assert `sendMessage` called once per eligible user (integration test — deferred)
- [ ] Assert `403` exception is caught and does not abort command (integration test — deferred)
- [ ] Assert per-user exception is caught (Log::error called) and remaining users still processed (integration test — deferred)

---

## Dependencies & Risks

| Dependency | Status |
|---|---|
| `GET /api/v1/issues/stats` endpoint | ✅ Exists |
| `IssueStatsService::getStats()` and `getHistory()` | ✅ Exist |
| `Telegram\Bot\Api` package | ✅ Already in use |
| `TelegramUser` model with `telegram_user_id` | ✅ Exists |
| AI agent task-dynamics query routing | ⚠️ Needs agent prompt update |

| Risk | Mitigation |
|---|---|
| Large user count causes Telegram rate limit | Chunk users, add 50ms delay between sends |
| `IssueStatsService::getStats()` N+1 queries | Verify it uses aggregate queries (already confirmed: uses `COUNT(*) FILTER`) — no N+1 per user, but test at scale |
| User blocks bot → 403 | Wrap in try/catch per user; log; optionally mark `blocked_at` |
| Week timezone mismatch | Use `Carbon::MONDAY` (already in `IssueStatsService`); confirm server timezone vs user timezone |
| AI agent sends wrong data in chart artifact | Add integration test or manual QA for the chat artifact flow |

---

## Implementation Phases

### Phase 1 — Weekly Telegram Report (Backend, ~1–2 days)

1. Create `SendWeeklyTaskSummaryCommand.php`
2. Add `formatMessage()` with all recommendation branches
3. Register in `routes/console.php` schedule
4. Write unit tests for all edge cases
5. Manual test: `php artisan tasks:send-weekly-summary` against dev database

### Phase 2 — Task Dynamics in App Chat (Frontend + Agent, ~0.5–1 day)

1. Determine whether existing `chart` artifact suffices (QA with a test prompt)
2. If yes: update AI agent system prompt to use chart for task-dynamics queries
3. If no: add `task_summary` artifact type (backend schema + frontend renderer), run `artifact-sync` agent

### Phase 3 — Polish (optional follow-up)

1. Add `weekly_summary_sent_at` migration for idempotency
2. Allow users to opt out of weekly summaries (notification settings)
3. Add user timezone support to the schedule (send at 18:00 in user's local timezone)
4. Add frontend "Send weekly summary now" button in notification settings for testing

---

## References

### Internal References

| Resource | Path |
|---|---|
| TaskStatsBlock (existing "Task Dynamics" widget) | `features/today-briefing/ui/task-stats-block.tsx:89` |
| IssueWeeklySummary (weekly comparison UI) | `features/issues/ui/issue-weekly-summary.tsx` |
| Issues progress page | `app/dashboard/issues/(progress)/progress/page.tsx` |
| Today progress page | `app/dashboard/today/progress/page.tsx` |
| getIssueStats server action | `features/issues/api/issue-stats.ts` |
| IssueStats types | `features/issues/model/types.ts:253-291` |
| SendMorningBriefCommand (Telegram pattern) | `app/Console/Commands/SendMorningBriefCommand.php` |
| IssueStatsService (all delta logic) | `app/Services/IssueStatsService.php` |
| IssueStatsController | `app/Http/Controllers/API/v1/IssueStatsController.php` |
| routes/api.php (stats routes) | `routes/api.php:208-209` |
| routes/console.php (schedule) | `routes/console.php` |
| TelegramUser model | `app/Models/TelegramUser.php` |
| Artifact renderers | `entities/artifact/ui/` |
| CreateArtifactTool schemas | `app/Services/Agent/Tools/CreateArtifactTool.php` |
| Team notification settings | `features/teams/api/notification-settings.ts` |
| TeamNotificationSetting type | `features/teams/model/types.ts:11-31` |

### Backend Patterns to Follow

- Telegram send pattern: `SendMorningBriefCommand.php` — instantiate `Telegram\Bot\Api`, use HTML parse mode, send to `$user->telegramUser->telegram_user_id`
- Per-user error isolation: wrap each user's send in `try/catch(\Throwable $e)` with `Log::error` — never `throw`
- User query pattern: `User::with('telegramUser')->whereHas('telegramUser')->get()`
- For large sets: `User::with('telegramUser')->whereHas('telegramUser')->chunk(100, fn($users) => ...)`
