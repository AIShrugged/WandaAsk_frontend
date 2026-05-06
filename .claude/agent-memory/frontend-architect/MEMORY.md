# WandaAsk Frontend — Agent Memory

## Project Structure

- Root: `/Users/slavapopov/Documents/WandaAsk_frontend` (no `src/` prefix)
- FSD layers at root: `app/`, `features/`, `entities/`, `shared/`, `widgets/`
- Path alias `@/*` → `./*`

## Key Shared Utilities

- `shared/lib/httpClient.ts` — `httpClient<T>()` and `httpClientList<T>()`
  wrappers
- `shared/lib/config.ts` — exports `API_URL` (from `process.env.API_URL`) and
  `APP_NAME`
- `shared/lib/getOrganizationId.ts` — reads `organization_id` cookie, redirects
  to login if missing
- `shared/lib/routes.ts` — `ROUTES.DASHBOARD.*` route constants
- `shared/lib/errors.ts` — `AppError`, `ServerError`, `FrontendError`,
  `NetworkError`
- `shared/types/common.ts` — `ApiResponse<T>`, `PaginatedResult<T>`, `PageProps`
- `shared/types/server-action.ts` — `ActionResult<T>`
- `shared/ui/card/Card.tsx` — card with
  `rounded-[var(--radius-card)] bg-card border border-border`
- `shared/ui/layout/skeleton.tsx` — `Skeleton`, `SkeletonList` components
- `shared/ui/error/ErrorDisplay.tsx` — env-aware error display (dev: details,
  prod: generic)
- `shared/lib/chart-theme.ts` — `CHART_TOOLTIP_STYLE`, `CHART_TICK_STYLE`,
  `CHART_GRID_COLOR`, `CHART_CURSOR_BAR`, `CHART_CURSOR_LINE`

## API Call Pattern (Server Action)

```ts
'use server';
import { API_URL } from '@/shared/lib/config';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { httpClient } from '@/shared/lib/httpClient';

export async function getSomeData() {
  const organizationId = await getOrganizationId();
  const { data } = await httpClient<MyType>(
    `${API_URL}/organizations/${organizationId}/resource`,
  );
  return data;
}
```

## Recharts Client Pattern

- All recharts components must be in `'use client'` files
- Co-locate chart sub-component + its export in the same file as the feature
  section component
- Use named chart color constants: primary green `hsl(142 47% 45%)`, blue
  `hsl(217 91% 60%)`, amber `hsl(45 93% 58%)`, red `hsl(0 84% 60%)`, violet
  `hsl(280 68% 60%)`
- **Always import chart style constants from `shared/lib/chart-theme.ts`** —
  never write inline style objects (causes `sonarjs/no-duplicate-string` lint
  errors):
  - `CHART_TOOLTIP_STYLE` — dark background `hsl(240 30% 7%)`, matches cosmic
    dark theme
  - `CHART_TICK_STYLE` — tick label style
  - `CHART_GRID_COLOR` — grid line color
  - `CHART_CURSOR_BAR` — cursor style for bar charts
  - `CHART_CURSOR_LINE` — cursor style for line charts

## ESLint Rules (strict — zero warnings allowed)

- `jsdoc/require-returns` — every function needs `@returns JSX element.` or
  `@returns Promise.`
- `jsdoc/require-param` — destructured params need `@param root0` +
  `@param root0.field` entries
- `import/order` — node_modules before internal; within internals: lucide before
  recharts
- `padding-line-between-statements` — blank line required before `const` after
  another `const`
- `arrow-body-style` — ESLint auto-fix changes `(x) => expr` to
  `(x) => { return expr }` for `.map`
- `sonarjs/no-duplicate-string` — extract repeated strings (tooltip style etc.)
  to top-level constants

## Sonner Notifications

- `<Toaster position="top-center" richColors />` in `app/Providers.tsx`
- Import: `import { toast } from 'sonner'`
- Use `toast.error(message)` for network/server errors surfaced to user

## Features Created

- `features/summary/` — `/dashboard/summary` analytics page (SSR + recharts
  client wrappers)
  - `api/summary.ts` — `getSummaryData()` →
    `GET /api/v1/organizations/:orgId/dashboard`
  - `types.ts` — `DashboardApiResponse` and all nested types
  - `ui/SummaryHeader.tsx` — server component, date formatted as English
    (`format(new Date(), 'MMMM d, yyyy')`, no locale param)
  - `ui/MeetingStats.tsx` — client, BarChart monthly + table of last 10 meetings
  - `ui/TaskStats.tsx` — client, donut PieChart by status + overdue badge
  - `ui/FollowupStats.tsx` — client, donut PieChart by status
  - `ui/ParticipantStats.tsx` — client, horizontal BarChart top-10
  - `ui/TeamStats.tsx` — client, horizontal BarChart by team size
- `app/dashboard/summary/page.tsx` — SSR page with 5-KPI grid + all stat
  sections
- `app/dashboard/summary/loading.tsx` — matching skeleton layout

## Button System (updated 2026-05-06)

Types live in `shared/types/button.ts` (`BUTTON_VARIANT`, `BUTTON_SIZE`). All
components exported from `@/shared/ui/button` (index.ts barrel).

**Never use raw `<button>` — always use the Button family.**

| Component     | File                                | When to use                                        |
| ------------- | ----------------------------------- | -------------------------------------------------- |
| `Button`      | `shared/ui/button/Button.tsx`       | Any text/icon button — forms, modals, main actions |
| `ButtonLink`  | `shared/ui/button/button-link.tsx`  | Link styled as a button (CTA, navigation)          |
| `ButtonIcon`  | `shared/ui/button/button-icon.tsx`  | Icon-only button — must have `aria-label`          |
| `ButtonClose` | `shared/ui/button/button-close.tsx` | Modal/panel close — must have `aria-label`         |
| `ButtonBack`  | `shared/ui/button/button-back.tsx`  | Back navigation (router.back())                    |
| `ButtonCopy`  | `shared/ui/button/button-copy.tsx`  | Copy to clipboard                                  |

**Variants (`ButtonVariant`):** `primary` (default), `secondary`, `danger`,
`ghost-danger`, `ghost`, `pill`

**Sizes (`ButtonSize`):** `md` (default, h-10), `sm` (h-9), `xs` (h-7)

**`fullWidth` prop** defaults to `true` — pass `fullWidth={false}` for compact
inline buttons that should not stretch.

## Route Constants Locations

All in `shared/lib/routes.ts` under `ROUTES.DASHBOARD.*`: HOME, TODAY,
TODAY_MEETINGS, TODAY_TASKS, TODAY_ACTIVITY, TODAY_PROGRESS, MEETINGS, TASKS,
CALENDAR, CHAT, ISSUES, AGENTS, AGENT_PROFILES, AGENT_PROFILES_NEW, AGENT_TASKS,
AGENT_TASKS_NEW, AGENT_ACTIVITY, TELEGRAM_CHATS, TEAMS, TEAMS_CREATE,
METHODOLOGY, STATISTICS, FOLLOWUPS, ORGANIZATION, PROFILE, PROFILE_ACCOUNT,
PROFILE_PASSWORD, PROFILE_CALENDAR, PROFILE_MENU, PROFILE_APPEARANCE, SUMMARY,
KANBAN, ISSUES_LIST, ISSUES_KANBAN, ISSUES_PROGRESS, MEETINGS_LIST,
MEETINGS_CALENDAR, MEETINGS_ORGANIZATION, MEETING_DETAIL (fn),
MEETING_DETAIL_OVERVIEW (fn), MEETING_DETAIL_AGENDA (fn), MEETING_DETAIL_TASKS
(fn), MEETING_DETAIL_TRANSCRIPT (fn)
