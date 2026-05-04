---
title:
  'feat: Focus Tasks — Chat/Telegram Agent Response, Formatting & Edge Cases v2'
type: feat
status: active
date: 2026-04-29
---

# feat: Focus Tasks — Chat/Telegram Agent Response, Formatting & Edge Cases v2

## Overview

This plan covers three tightly coupled problem areas in the Focus feature:

1. **Agent behavior** — the bot must respond to "show my focused tasks" with
   genuinely focused/priority tasks, and when the user has no focus set, offer
   relevant alternatives instead of a generic list.
2. **Task rendering in chat** — `task_table` artifacts and markdown task blocks
   currently receive raw JSON or MD with broken formatting; we need a robust
   display layer.
3. **Focus-setting via chat/Telegram** — the bot's `set_user_focus` pathway
   needs to cover all sub-cases: with date/sprint/sync context, without date,
   and explicit focus correction ("focus changed to…").

---

## Problem Statement

### 1. Agent gap: "focused tasks" request → generic task list

When a user says **"покажи мои фокусные задачи"** or **"what are my focused
tasks?"**:

- The agent currently has no explicit instruction to filter `get_open_issues` by
  the user's focus text or by priority.
- It can call `get_open_issues` and return **all open tasks**, or call
  `build_daily_plan` — neither of which is "focused tasks".
- The TA requires: if the user's focus text implies a topic/sprint/date, return
  tasks that match it. If no match, suggest high-priority ones and say there are
  no exact focus matches.

### 2. Rendering: task data arrives as raw JSON or Markdown in chat messages

- The agent sometimes writes task data inline in chat text as JSON (e.g.
  `{"title": "...", "status": "open", ...}`) or as markdown list items.
- `ChatMessageContent` renders this as plain text via `react-markdown` — but
  fenced JSON blocks or inline JSON objects look ugly.
- The `task_table` artifact is the correct channel for structured tasks — but
  the agent only creates it when `create_artifact(type: "task_table")` is
  called. When it doesn't, raw text leaks into chat.

### 3. Edge cases in `set_user_focus` flow

Per the TA subcases:

| Sub-case                                                 | Current behavior                                                                  | Expected                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| User says "Фокусируюсь на v2.0 до 25 апреля"             | `set_user_focus` IS called — ✅                                                   | Parse date correctly → `deadline: 2026-04-25`                           |
| User sets focus for a sprint/sync ("sprint 14")          | `set_user_focus` called — ✅                                                      | Store sprint label as focus_text; ideally extract end date from context |
| User says "мои задачи" (no focus)                        | Agent calls `get_open_issues` without focus filter — ❌                           | Should explain focus is not set; offer top-priority tasks               |
| User corrects focus "нет, фокус изменился — теперь v2.1" | Agent calls `set_user_focus` if it hears "фокус" — ✅ but only if wording matches | Must reliably detect corrections/overrides                              |
| User asks for focused tasks but has 0 priority issues    | Falls through to all open tasks — ❌                                              | Graceful fallback with explanation                                      |

### 4. `FocusBlock` task rendering — markdown/JSON cleanup

When focus_text contains markdown formatting (`**bold**`, `- list item`) or is
stored with newlines, the `ReadonlyFocusBlock` renders it as raw text (plain
`<p>` tag). MD is not parsed.

---

## Architecture Context

```
backend/
  app/Services/Agent/AgentService.php          ← system prompt (lines 932–940 = focus section)
  app/Services/Agent/Tools/
    SetUserFocusTool.php                       ← saves focus; source: explicit|confirmed
    GetUserFocusTool.php                       ← reads focus; not called in normal flow
    ClearUserFocusTool.php                     ← deletes focus
    GetOpenIssuesTool.php                      ← returns open/in_progress issues; no focus filter
    BuildDailyPlanTool.php                     ← scoped to personal/team; no focus filter
    CreateArtifactTool.php                     ← creates task_table artifacts
  app/Services/Agent/MemoryService.php         ← injects "### Active Focus" in system prompt

frontend/
  features/user-focus/
    types.ts                                   ← UserFocus { focus_text, deadline, expires_at }
    api/focus.ts                               ← getUserFocus / setUserFocus / clearUserFocus
    ui/focus-block.tsx                         ← FocusBlock (editable + readonly)
    ui/focus-reminder-banner.tsx               ← FocusReminderBanner
  entities/artifact/ui/task-table.tsx          ← task_table artifact renderer (card-based)
  features/chat/ui/chat-message-content.tsx    ← markdown+HTML renderer for chat messages
```

**Key invariant:** Focus is a **plain text goal string**, not a foreign key to
any issue. There is no `focus_task_id`. The agent must use heuristic matching
(keywords, sprint names, date ranges) to map focus to tasks.

---

## Proposed Solution

### Part A — Backend: Agent System Prompt (AgentService.php)

Extend the **"Focus & Priorities"** section (lines 932–940) with explicit
task-request behavior.

#### A1. When user requests "focused tasks"

Add instruction:

```
## Focus Tasks Request

When user asks for "focused tasks", "мои фокусные задачи", "задачи по фокусу",
or any synonym:

1. Read the "### Active Focus" section from your memory context.
2. If focus IS set:
   a. Call `get_open_issues` (or `build_daily_plan scope=personal`).
   b. Filter returned tasks by keyword overlap with the focus_text
      (match task name/description against focus keywords).
   c. Also include any tasks with priority >= CRITICAL (priority >= 8)
      regardless of keyword match.
   d. If filtered list is non-empty → return it as task_table artifact,
      explain the focus context used.
   e. If filtered list is empty → say "No tasks found that directly match
      your focus «{focus_text}». Here are your highest priority tasks instead:"
      and return top 5 by priority as task_table artifact.
3. If focus is NOT set:
   a. Explain: "You haven't set a focus yet."
   b. Offer: "Here are your current open tasks — would you like to set one
      of these as your focus?" and show top 5 tasks.
   c. Suggest calling `set_user_focus` if they describe their priority.
```

#### A2. Reliable focus-setting detection for corrections

Add to the "Focus & Priorities" section:

```
**Detecting focus corrections:**
- "нет, мой фокус изменился" / "focus changed to" / "теперь фокусируюсь на" →
  call `set_user_focus` with source=confirmed (overwrite existing).
- "забудь про фокус" / "отмени фокус" → call `clear_user_focus`.
- Even if current focus is set, always overwrite when user explicitly states
  a new priority.
```

#### A3. Structured task output — always use artifact

Add to the "Focus Tasks Request" section:

```
**Output format rule:**
Always render task results via `create_artifact(type: "task_table")`,
not as raw JSON or markdown list in the chat message.
The chat message should contain only the explanation/context sentence.
```

### Part B — Backend: New `GetFocusedIssuesTool`

> **Alternative to pure prompt engineering** — a dedicated tool is more reliable
> and testable than asking the LLM to filter in-context.

Create `/app/Services/Agent/Tools/GetFocusedIssuesTool.php`:

```php
class GetFocusedIssuesTool extends AbstractAgentTool
{
    // Tool name: get_focused_issues
    // Description: "Get the user's focused tasks — issues that keyword-match their
    //   active focus text, or high-priority issues if focus is not set.
    //   Returns focused_tasks and fallback_tasks separately so the agent can
    //   explain which list is being shown."
    //
    // Parameters:
    //   none required (reads focus from injected profile context)
    //
    // Logic:
    //   1. Load focus via UserFocusService::getFocus($profile)
    //   2. If focus: tokenize focus_text → keywords
    //      Query Issue where (name ILIKE any keyword OR desc ILIKE any keyword)
    //        AND status NOT IN ('done')
    //      UNION query Issue where priority >= PRIORITY_CRITICAL
    //        AND status NOT IN ('done') AND assignee_id = user->id
    //   3. If no focus: return top 10 open issues by priority for user
    //   4. Return { focus_text, focused_tasks: [...], fallback_tasks: [...],
    //               has_focus: bool, matched_count: int }
}
```

Register in `AgentToolRegistrar.php`.

### Part C — Frontend: Fix task rendering in chat

#### C1. `ChatMessageContent` — detect and render JSON task blocks

File: `features/chat/ui/chat-message-content.tsx`

Problem: Agent sometimes sends inline JSON like:

````
Here are your tasks:
```json
[{"title": "Deploy v2.0", "status": "open", ...}]
````

````

This renders as ugly code block with raw JSON.

Fix: Add a pre-processing step to `ChatMessageContent` that detects fenced
`json` code blocks containing task-shaped objects, and replaces them with a
rendered `<TaskTable>` component inline in the message.

```tsx
// features/chat/ui/chat-message-content.tsx
function extractInlineTaskBlocks(content: string): {
  segments: Array<{ type: 'text' | 'tasks'; content: string | TaskTableData }>;
}
````

Detection heuristic: fenced code block with `json` language tag whose content
parses to an array where every item has at least `title` + `status`.

#### C2. `TaskTable` — handle missing/malformed fields gracefully

File: `entities/artifact/ui/task-table.tsx`

Current issues:

- `task.description` can be a long JSON string (when sourced from DB without
  truncation) — needs `line-clamp-2` already applied, but JSON structure looks
  bad
- No `priority` field rendered (the artifact schema has no priority, but
  `GetFocusedIssuesTool` will return it)
- Status values beyond the 4 defined ones (e.g. `paused`, `review`, `reopen`)
  fall through to `bg-muted` with raw string label

Fix:

- Expand `STATUS_STYLES` and `STATUS_LABELS` for `paused`, `review`, `reopen`
- Optionally render a priority indicator (icon or dot) when `priority >= 8`
- Sanitize description: if it looks like JSON (starts with `{` or `[`), show a
  collapsed `<details>` instead of inline text

#### C3. `FocusBlock` — render markdown in focus_text

File: `features/user-focus/ui/focus-block.tsx`

`ReadonlyFocusBlock` and `FocusText` render `focus.focus_text` as plain text. If
the user wrote `**v2.0** до апреля` or the bot stored multiline text, it shows
raw markdown.

Fix: Use `react-markdown` (already a dependency) with `remarkGfm` to render
`focus_text` in readonly mode. In edit mode, keep plain textarea (user types raw
text).

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function FocusText({ focus }: { focus: UserFocus }) {
  return (
    <>
      <div className='text-sm text-foreground prose prose-sm dark:prose-invert max-w-none'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {focus.focus_text ?? ''}
        </ReactMarkdown>
      </div>
      {/* deadline rendering unchanged */}
    </>
  );
}
```

---

## Edge Cases

### EC1: User sets focus with date "до 25 апреля" (relative date in Russian)

The `SetUserFocusTool` accepts `deadline` in `YYYY-MM-DD` format. The agent must
convert "до 25 апреля" → `2026-04-25` before calling the tool.

**Current state:** The LLM can do this conversion, but the system prompt doesn't
explicitly instruct it to.

**Fix (system prompt addition):**

```
When extracting deadline from natural language (e.g. "до 25 апреля",
"by end of May", "until sprint 14 end"), convert to YYYY-MM-DD
using the current year (2026) before passing to set_user_focus.
```

### EC2: User mentions a sprint but no date

"Фокусируюсь на v2.0 до конца спринта" — sprint has no explicit end date.

**Fix:** Store as-is (`focus_text: "v2.0"`, no deadline), agent replies: "Saved
focus: v2.0. Want to add a deadline for this sprint?"

### EC3: User has focus set but 0 matching tasks and 0 high-priority tasks

`GetFocusedIssuesTool` returns `matched_count: 0` and empty `fallback_tasks`.

**Agent response:** "Your focus is set to «{focus_text}» but I couldn't find any
open tasks that match. All tasks may already be done — great job! 🎉 You can
[clear your focus] or set a new one."

### EC4: User asks via Telegram (not web chat)

Focus tools are registered for both web and Telegram channels (via
`AgentToolRegistrar` with `$channel` param). The `GetFocusedIssuesTool` uses
profile context — it works identically in both channels.

**Frontend rendering:** Telegram has no artifact panel. The agent must detect
channel and adjust output format:

- Web: `create_artifact(type: "task_table")` + short chat message
- Telegram: format as numbered markdown list in message text (no artifacts)

The system prompt already has channel-awareness. Add to the Focus Tasks section:

```
If channel = telegram: format focused tasks as a markdown list in the message.
If channel = web: always use task_table artifact.
```

### EC5: User corrects focus mid-conversation

"Нет, фокус изменился — теперь это backend API, не фронт"

Must trigger `set_user_focus` with `source=confirmed`. The corrected text should
overwrite the previous focus (backend upserts via `updateOrCreate`).

### EC6: User asks about focused tasks when focus has expired

`UserFocus.expires_at` is in the past. `MemoryService` only injects active focus
(checks `active()` scope). So the agent sees NO active focus in context.

**Result:** Agent should treat this as "no focus" (EC3/EC4 fallback). Frontend
`FocusBlock` already shows the "Focus completed!" expired state.

---

## Acceptance Criteria

### Frontend — Chat rendering

- [ ] `TaskTable` renders status `paused`, `review`, `reopen` with appropriate
      colors
- [ ] `TaskTable` truncates and sanitizes description — no raw JSON visible
- [ ] `ChatMessageContent` detects fenced JSON task arrays and renders them as
      `TaskTable` inline
- [ ] `FocusBlock` readonly mode renders markdown in `focus_text` via
      `react-markdown`
- [ ] `FocusReminderBanner` also renders markdown in focus_text
- [ ] Focus edit form: textarea accepts plain text (no markdown preview)

### Frontend — Issues list table

- [ ] "Priority" column shows label + color for non-zero priorities
- [ ] "Deadline" column shows formatted date with relative label; overdue in red
- [ ] Both columns are sortable via column header click

### Frontend — Focused Tasks block

- [ ] `FocusedTasksBlock` appears on `/dashboard/today/tasks` below FocusBlock
- [ ] `FocusedTasksBlock` appears on `/dashboard/issues/(list)/list` above main
      table
- [ ] Each task card links to `/dashboard/issues/{id}`
- [ ] Empty state shown when no tasks match focus
- [ ] "Set focus" CTA shown when user has no active focus

### Backend — Agent

- [ ] "Покажи мои фокусные задачи" → `get_focused_issues` called, `task_table`
      artifact returned
- [ ] No focus set → fallback message + top-critical tasks offered
- [ ] "Фокусируюсь на v2.0 до 25 апреля" → `set_user_focus` with
      `deadline: "2026-04-25"`
- [ ] "Нет, фокус изменился" → `set_user_focus` overrides existing
- [ ] Telegram: numbered list with issue links; no artifact
- [ ] Web: `task_table` artifact + one-sentence context message

### Backend — API

- [ ] `GET /api/v1/me/issues/focused` returns focus-filtered issues
- [ ] Returns `meta.has_focus: false` when no focus is set
- [ ] Full-text search works for Russian-language focus texts
- [ ] Priority fallback (>= 500) returns critical issues when no keyword matches

### Edge cases

- [ ] Focus expired → agent + UI treat as "no focus"
- [ ] Sprint with no date → stored without deadline, bot prompts to add one
- [ ] 0 matching + 0 critical tasks → graceful message, no empty artifact/block
- [ ] Very long focus_text (500 chars) → renders cleanly, no overflow

---

## Implementation Phases

### Phase 1 — Frontend rendering fixes (self-contained, no backend changes)

1. `entities/artifact/ui/task-table.tsx` — expand status styles + description
   sanitization + optional priority dot
2. `features/user-focus/ui/focus-block.tsx` — add `react-markdown` rendering in
   readonly `FocusText`
3. `features/chat/ui/chat-message-content.tsx` — JSON task block detection +
   inline `TaskTable` rendering

**Files:**

- `entities/artifact/ui/task-table.tsx`
- `features/user-focus/ui/focus-block.tsx`
- `features/chat/ui/chat-message-content.tsx`

### Phase 2 — Backend: System prompt enhancement

1. Extend `AgentService.php` "Focus & Priorities" section (lines 932–940) with
   focused-task request behavior, correction detection, and date parsing
2. Add channel-aware output format instruction (web vs telegram)

**Files:**

- `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/AgentService.php`
  (lines 932–940, +new section ~950+)

### Phase 3 — Backend: New `GetFocusedIssuesTool`

1. Create `GetFocusedIssuesTool.php` with keyword-match + priority fallback
   logic
2. Register in `AgentToolRegistrar.php`
3. Update system prompt to reference the new tool instead of generic
   `get_open_issues`

**Files:**

- `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/Tools/GetFocusedIssuesTool.php`
  ← NEW
- `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/AgentToolRegistrar.php`
- `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/AgentService.php`

### Phase 4 — Frontend: Issues table Priority + Deadline columns

1. Add "Priority" and "Deadline" columns to `features/issues/ui/issues-page.tsx`
2. Add `priority` and `due_date` to `IssueSortField` type
3. Pass new sort fields through `getIssues()` API call
4. Format deadline with relative time + color coding

**Files:**

- `features/issues/ui/issues-page.tsx` — add 2 columns to `<thead>` + `<tbody>`
- `features/issues/model/types.ts` — extend `IssueSortField`
- `app/dashboard/issues/(list)/list/page.tsx` — allow new sort params

### Phase 5 — Frontend: FocusedTasksBlock component + server action

1. Create `features/user-focus/api/focused-issues.ts` — calls
   `/me/issues/focused`
2. Create `features/user-focus/ui/focused-tasks-block.tsx` — Server Component
3. Integrate into `app/dashboard/today/tasks/page.tsx`
4. Integrate into `app/dashboard/issues/(list)/list/page.tsx` via
   `IssuesListTab`
5. Export from `features/user-focus/index.ts`

**Files:**

- `features/user-focus/api/focused-issues.ts` — NEW
- `features/user-focus/ui/focused-tasks-block.tsx` — NEW
- `features/user-focus/index.ts` — add exports
- `app/dashboard/today/tasks/page.tsx` — integrate block
- `app/dashboard/issues/(list)/list/page.tsx` — integrate block

### Phase 6 — QA: Edge case testing

Test matrix:

- [ ] Web chat: set focus → ask focused tasks → verify task_table artifact
      appears
- [ ] Web chat: no focus → ask focused tasks → verify fallback message + top
      tasks
- [ ] Telegram: same two scenarios with markdown list output
- [ ] Set focus with date "до 3 мая" → verify deadline parsed as 2026-05-03
- [ ] Set focus without date → verify no deadline stored
- [ ] Correct focus mid-session → verify override
- [ ] Focus expired → verify agent treats as "no focus"

---

## Confirmed Answers (from product)

1. **Keyword matching**: Use PostgreSQL full-text search (`@@` operator) for
   Russian text robustness.
2. **Priority threshold for fallback**: Show only `priority >= CRITICAL (500)`,
   not HIGH.
3. **Telegram task format**: Task name + link to the task in the web app (e.g.
   `https://app.shrugged.ai/dashboard/issues/{id}`). No status or assignee
   inline.
4. **FocusReminderBanner**: Apply markdown rendering there too (same as
   FocusBlock).
5. **`task_table` priority field**: No — do not add priority to the artifact
   schema.

## New Requirements (from product, 2026-04-29)

### NR1: Issues list + Dashboard-Tasks pages must show "Focused Tasks" section

Both `/dashboard/issues/(list)/list` and `/dashboard/today/tasks` must display a
dedicated **"Focused Tasks"** block at the top (above the main task table/list).

**Behavior:**

- If user has active focus: show tasks that match focus keywords (PG full-text)
  OR are `priority >= 500`.
- If no matching tasks: show empty-state "No focused tasks" with a CTA to set
  focus.
- If no focus set: show "You haven't set a focus" with link to
  `/dashboard/profile/account`.
- Focused tasks list is **separate from the main list** — tasks can appear in
  both.

**Frontend architecture:**

```
features/user-focus/ui/focused-tasks-block.tsx   ← NEW Server Component
  Props: focus: UserFocus | null
  - Calls getFocusedIssues() server action (new)
  - Renders: section header + task cards with link to /dashboard/issues/{id}
  - Empty/no-focus states handled inline

features/user-focus/api/focused-issues.ts        ← NEW server action
  getFocusedIssues(): Promise<FocusedIssue[]>
  - Calls GET /api/v1/issues/focused (new backend endpoint)
  - Returns array of issues matching focus context
```

**Page integration:**

- `app/dashboard/today/tasks/page.tsx` — add
  `<FocusedTasksBlock focus={focus} />` below `<FocusBlock>`, above
  `<TaskStatsBlock>`
- `app/dashboard/issues/(list)/list/page.tsx` — pass focused issues to
  `IssuesListTab`, render block above the table

### NR2: Issues list must display Priority and Deadline columns

The current issues table (`features/issues/ui/issues-page.tsx`) does not show
`priority` as text or `due_date` as a column. Both must be added.

**Priority column:**

- Show text label (Critical / High / Normal / Low / Minimal) using
  `getPriorityLevel()`
- Color-coded using existing `PRIORITY_LEVELS[].color` constants
- Only show if `priority !== 0` (Normal is implicit, no need to show)
- Column header: "Priority" — sortable (add `priority` to `IssueSortField`)

**Deadline column:**

- Show `due_date` formatted as relative ("3 days left", "overdue", "today") +
  absolute date
- Color: `text-destructive` if overdue, `text-amber-500` if due today/tomorrow,
  else `text-muted-foreground`
- Column header: "Deadline" — sortable (add `due_date` to `IssueSortField`)
- Null due_date: show "—"

**Backend sort support:** Confirm `GET /api/v1/issues` supports `sort=priority`
and `sort=due_date`. Check `IssueController` index method for allowed sort
fields.

### NR3: Backend — new `GET /api/v1/issues/focused` endpoint

The `FocusedTasksBlock` needs a dedicated endpoint that applies focus-aware
filtering server-side.

**Route:** `GET /api/v1/me/issues/focused` (or `/api/v1/issues/focused`)

**Logic:**

1. Load active focus for authenticated user via
   `UserFocusService::getFocus($profile)`
2. If focus set: query `Issue` where:
   - `to_tsvector('russian', name || ' ' || coalesce(description, '')) @@ plainto_tsquery('russian', $focusKeywords)`
   - OR `priority >= Issue::PRIORITY_CRITICAL` (500)
   - AND `status NOT IN ('done')`
   - AND `assignee_id = $user->id` OR `user_id = $user->id`
3. If no focus: return `[]` with `meta.has_focus = false`
4. Return `IssueResource` collection + `meta.has_focus`, `meta.focus_text`

**Files:**

- `routes/api.php` — new route
- `app/Http/Controllers/API/v1/FocusedIssuesController.php` — NEW
- Returns existing `IssueResource` (no new resource needed)

---

## References

### Internal

- `features/user-focus/ui/focus-block.tsx` — FocusBlock component (all modes)
- `features/user-focus/api/focus.ts` — getUserFocus / setUserFocus /
  clearUserFocus
- `entities/artifact/ui/task-table.tsx` — TaskTable artifact renderer
- `features/chat/ui/chat-message-content.tsx` — chat markdown/HTML renderer
- `entities/artifact/model/types.ts` — ArtifactType union + TaskTableArtifact
- Backend: `app/Services/Agent/AgentService.php` lines 932–940 — focus system
  prompt
- Backend: `app/Services/Agent/Tools/SetUserFocusTool.php` — focus save tool
- Backend: `app/Services/Agent/Tools/GetOpenIssuesTool.php` — generic issues
  tool
- Backend: `app/Services/Agent/Tools/GetMeetingTasksTool.php` — meeting tasks
  tool
- Backend: `app/Services/Agent/MemoryService.php` line 81 — focus injection into
  context
- Backend: `app/Models/Issue.php` — `PRIORITY_CRITICAL` constant (line 102)
- Previous plans:
  - `docs/plans/2026-04-24-feat-user-focus-surface-across-app-plan.md`
  - `docs/plans/2026-04-27-feat-focus-priority-task-done-lifecycle-plan.md`
