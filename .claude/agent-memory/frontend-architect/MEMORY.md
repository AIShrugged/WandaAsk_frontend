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
  `rounded-[var(--radius-card)] bg-card border border-border shadow-card`
- `shared/ui/layout/skeleton.tsx` — `Skeleton`, `SkeletonList` components
- `shared/ui/error/ErrorDisplay.tsx` — env-aware error display (dev: details,
  prod: generic)

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
- Standard tooltip style:
  `{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 5.9% 90%)', borderRadius: '6px', fontSize: 12 }`
- Standard tick style: `{ fontSize: 11, fill: 'hsl(240 3.8% 46.1%)' }`
- Grid color: `hsl(240 5.9% 90%)`

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
  - `ui/SummaryHeader.tsx` — server component, date via date-fns/ru locale
  - `ui/MeetingStats.tsx` — client, BarChart monthly + table of last 10 meetings
  - `ui/TaskStats.tsx` — client, donut PieChart by status + overdue badge
  - `ui/FollowupStats.tsx` — client, donut PieChart by status
  - `ui/ParticipantStats.tsx` — client, horizontal BarChart top-10
  - `ui/TeamStats.tsx` — client, horizontal BarChart by team size
- `app/dashboard/summary/page.tsx` — SSR page with 5-KPI grid + all stat
  sections
- `app/dashboard/summary/loading.tsx` — matching skeleton layout
- `ROUTES.DASHBOARD.SUMMARY = '/dashboard/summary'` added to
  `shared/lib/routes.ts`

## Route Constants Locations

All in `shared/lib/routes.ts` under `ROUTES.DASHBOARD.*`: HOME, CALENDAR, CHAT,
MEETING, TEAMS, METHODOLOGY, STATISTICS, FOLLOWUPS, ORGANIZATION, PROFILE,
SUMMARY
