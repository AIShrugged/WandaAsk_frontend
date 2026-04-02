---
title: Debug Page Tabs & API Registry
type: feat
status: completed
date: 2026-04-02
---

# Debug Page Tabs & API Registry

## Overview

Rename the existing **Debug Logs** page to **Debug**, convert its current
content into a **Logs** tab, and add a second **API** tab showing a searchable
registry of all backend and frontend API endpoints with visual relationship
mapping.

## Problem Statement

The Debug Logs page currently shows only live HTTP request logs. As the app
grows, developers need a quick way to:

1. See the full inventory of backend API endpoints (method, path, controller,
   auth required)
2. See which frontend Server Actions call which backend routes
3. Navigate between these views without leaving the debug context

## Proposed Solution

Convert `/dashboard/debug-logs` into a tab-based `/dashboard/debug` page
(keeping the old URL as an alias/redirect for backwards compatibility):

- **Tab 1 — Logs**: Existing `DebugLogsViewer` component, unchanged
- **Tab 2 — API**: Static registry table of all backend routes, with a column
  showing which frontend Server Action file calls each endpoint (visual
  connection)

The API Registry tab is **statically generated at build time** from a
hand-maintained data file. This avoids runtime overhead and keeps the feature
simple — the data is only relevant in dev mode.

## Technical Approach

### Route Structure

```
app/dashboard/debug/
  layout.tsx            ← new: Card + PageHeader("Debug") + DebugTabsNav
  page.tsx              ← redirect to /dashboard/debug/logs
  logs/
    page.tsx            ← existing DebugLogsViewer (moved here)
  api/
    page.tsx            ← new ApiRegistryPage (Server Component)
```

The old route `app/dashboard/debug-logs/page.tsx` becomes a redirect:

```tsx
// app/dashboard/debug-logs/page.tsx
import { redirect } from 'next/navigation';
export default function DebugLogsRedirect() {
  redirect('/dashboard/debug/logs');
}
```

### New ROUTES constants (`shared/lib/routes.ts`)

```ts
DEBUG: '/dashboard/debug',
DEBUG_LOGS: '/dashboard/debug/logs',     // updated (was /dashboard/debug-logs)
DEBUG_API: '/dashboard/debug/api',
```

### Feature structure

```
features/debug/
  ui/
    DebugTabsNav.tsx        ← 'use client', route-based tabs (Logs | API)
    ApiRegistryTable.tsx    ← displays the API route registry
    ApiEndpointRow.tsx      ← single row with method badge, path, source link
  model/
    api-registry.ts         ← static data: all backend routes + frontend callers
  index.ts                  ← public exports
```

The old `features/debug-logs/` folder is **renamed** to `features/debug/` and
its exports updated.

### API Registry Data Model (`features/debug/model/api-registry.ts`)

```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string; // e.g. "/v1/agent-tasks"
  controller: string; // e.g. "AgentTaskController@index"
  auth: boolean; // requires auth:sanctum middleware
  frontendCallers: string[]; // e.g. ["features/agents/api/agents.ts"]
}

export const API_REGISTRY: ApiEndpoint[] = [
  // Auth
  {
    method: 'POST',
    path: '/v1/auth/login',
    controller: 'AuthController@login',
    auth: false,
    frontendCallers: ['features/auth/api/auth.ts'],
  },
  {
    method: 'POST',
    path: '/v1/auth/logout',
    controller: 'AuthController@logout',
    auth: true,
    frontendCallers: ['features/auth/api/auth.ts'],
  },
  {
    method: 'POST',
    path: '/v1/auth/register',
    controller: 'AuthController@register',
    auth: false,
    frontendCallers: ['features/auth/api/auth.ts'],
  },
  // ... all ~84 routes
];
```

The `frontendCallers` field is populated by manual cross-referencing of
`features/*/api/*.ts` files against backend routes. Where no frontend caller
exists, the array is empty (route is backend-only or webhook).

### ApiRegistryTable Component

A Server Component rendering a filterable table. Since it's dev-only and the
data is static, no server action needed — all filtering is client-side.

Columns: | Method | Path | Controller | Auth | Frontend Caller |

- **Method**: colored badge matching `DebugLogsViewer` color scheme (GET=sky,
  POST=violet, PUT=amber, PATCH=orange, DELETE=red)
- **Path**: monospace, params highlighted (e.g. `{agentTask}` in dimmer color)
- **Controller**: dimmed, short name (strip namespace)
- **Auth**: lock icon if `auth: true`
- **Frontend Caller**: file path as a chip; clicking copies path to clipboard;
  if multiple callers, show all chips; if none, show "—" in dim

### Visual Connection (relationship)

The "visual connection" between backend and frontend is expressed through:

1. The **Frontend Caller** column linking routes to source files
2. A **filter by feature** dropdown — select e.g. "agents" → shows only routes
   called by `features/agents/api/*.ts`
3. Color-coded caller chips matching the feature domain (optional enhancement)

No graph/diagram rendering — a table with filtering provides the same
information with lower complexity.

### Tab Navigation (`features/debug/ui/DebugTabsNav.tsx`)

Follows the exact pattern of `AgentsTabsNav`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.DEBUG_LOGS, label: 'Logs' },
  { href: ROUTES.DASHBOARD.DEBUG_API, label: 'API' },
] as const;

export function DebugTabsNav() {
  const pathname = usePathname();
  return (
    <div className='flex gap-1 border-b border-border'>
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            className={[
              'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

### Layout (`app/dashboard/debug/layout.tsx`)

```tsx
import { notFound } from 'next/navigation';
import { isDev } from '@/shared/lib/logger';
import { DebugTabsNav } from '@/features/debug';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDev) notFound();
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Debug' />
      <div className='flex flex-col h-full overflow-hidden'>
        <DebugTabsNav />
        <div className='flex-1 overflow-hidden'>{children}</div>
      </div>
    </Card>
  );
}
```

Note: `isDev` guard moves from `page.tsx` to `layout.tsx` so both tabs are
protected.

### Sidebar Menu (`features/menu/lib/options.ts`)

Update the sidebar entry label and href:

```ts
// Before:
{ id: 'debug-logs', label: 'Debug Logs', icon: 'terminal', href: ROUTES.DASHBOARD.DEBUG_LOGS }

// After:
{ id: 'debug', label: 'Debug', icon: 'terminal', href: ROUTES.DASHBOARD.DEBUG, activeHref: ROUTES.DASHBOARD.DEBUG }
```

## Acceptance Criteria

- [x] Sidebar item label changed from "Debug Logs" to "Debug"
- [x] `/dashboard/debug-logs` redirects to `/dashboard/debug/logs`
- [x] `/dashboard/debug` and `/dashboard/debug/logs` render the existing logs
      viewer
- [x] `/dashboard/debug/api` renders the API registry table
- [x] Tab strip shows "Logs" and "API" tabs, active tab highlighted correctly
- [x] API table shows all ~84 backend routes with correct method, path,
      controller, auth flag
- [x] Frontend caller column links each route to the correct
      `features/*/api/*.ts` file
- [x] Method badges use the same color scheme as `DebugLogsViewer` (sky=GET,
      violet=POST, etc.)
- [x] Filtering: text search on path, filter by HTTP method, filter by frontend
      feature
- [x] Both tabs are hidden in production (notFound guard in layout)
- [x] `ROUTES.DASHBOARD.DEBUG_LOGS` updated in `routes.ts` and all usages
      updated

## Dependencies & Risks

- **No backend changes needed** — the API registry is static data
- The old `features/debug-logs/` folder must be renamed/moved; update the barrel
  import in `features/debug-logs/index.ts` or delete and recreate
- `app/api/debug-logs/route.ts` (Next.js API route for log polling) is **not
  renamed** — it is an internal endpoint not a user-visible URL
- `shared/lib/devFetchInterceptor.ts` references `/api/debug-logs` directly —
  unchanged
- The `ROUTES.DASHBOARD.DEBUG_LOGS` constant changes its value; ensure the
  sidebar and any test using the old path `/dashboard/debug-logs` are updated

## Implementation Order

1. Update `ROUTES` in `shared/lib/routes.ts`
2. Rename `features/debug-logs/` → `features/debug/`, update `index.ts`
3. Create `features/debug/ui/DebugTabsNav.tsx`
4. Create `features/debug/model/api-registry.ts` with all route data
5. Create `features/debug/ui/ApiRegistryTable.tsx` + `ApiEndpointRow.tsx`
6. Create `app/dashboard/debug/layout.tsx`, `page.tsx`, `logs/page.tsx`,
   `api/page.tsx`
7. Replace `app/dashboard/debug-logs/page.tsx` with redirect
8. Update sidebar options label/href

## References

- Existing viewer: `features/debug-logs/ui/DebugLogsViewer.tsx`
- Tab pattern: `features/agents/ui/agents-tabs-nav.tsx`
- Layout pattern: `app/dashboard/agents/layout.tsx`
- Backend routes: `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php`
- Frontend API files: `features/*/api/*.ts` (29 files)
- Sidebar menu: `features/menu/lib/options.ts:87`
- Routes constant: `shared/lib/routes.ts:28`
