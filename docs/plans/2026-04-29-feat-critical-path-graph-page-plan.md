---
title: 'feat: Critical Path Graph on Today/Activity Page'
type: feat
status: active
date: 2026-04-29
---

# Critical Path Graph on Today/Activity Page

## Overview

Add a new tab **Critical Path** under `/dashboard/today/critical-path` that
renders an interactive CPM (Critical Path Method) DAG graph. The feature fetches
graph data from `GET /api/v1/critical-path`, allows the user to trigger a
`POST /api/v1/critical-path/rebuild`, polls while the graph is computing, and
renders issue nodes with edges, slack badges, and critical-path highlighting —
all styled to the existing cosmic dark theme (`#030308` background, violet
primary `#a87ff0`, green accent `#22c55e`).

The design reference is `/Users/slavapopov/Downloads/Critical Path.html`.
Critical path nodes/edges use an **orange-red accent** (`#ff7043` in the design
file) rather than violet — this is intentional and acceptable as a dedicated
warning/danger color for critical-path emphasis, distinct from the main violet
brand color.

---

## Scope of Changes

| Area                                               | What changes                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `shared/lib/routes.ts`                             | Add `TODAY_CRITICAL_PATH` constant                                                                                  |
| `features/today-briefing/ui/today-tabs-nav.tsx`    | Add "Critical Path" tab                                                                                             |
| `app/dashboard/today/critical-path/page.tsx`       | New page (Server Component shell)                                                                                   |
| `app/dashboard/today/critical-path/loading.tsx`    | Skeleton loader                                                                                                     |
| `features/issues/api/critical-path.ts`             | New server actions: `getCriticalPath`, `rebuildCriticalPath`                                                        |
| `features/issues/model/types.ts`                   | Add `CriticalPathGraph`, `CriticalPathNode`, `CriticalPathEdge`, `CriticalPathStatus`, `CriticalPathEdgeType` types |
| `features/issues/ui/critical-path-graph.tsx`       | New Client Component: interactive SVG graph                                                                         |
| `features/issues/ui/critical-path-node-detail.tsx` | New Client Component: right-panel node detail                                                                       |
| `features/issues/ui/critical-path-page.tsx`        | New Client Component: page orchestrator (fetch state, polling, rebuild)                                             |
| `features/issues/index.ts`                         | Export new types and components                                                                                     |

> **Note:** The graph interaction (pan, zoom, node click) requires
> `'use client'`. The page shell (`page.tsx`) can be a Server Component that
> renders the Client Component orchestrator. Scope (`organization_id` /
> `team_id`) is read from `searchParams` — same pattern as
> `issues/(list)/list/page.tsx`.

---

## FSD Placement Decision

The feature lives in `features/issues/` rather than a new
`features/critical-path/` because:

- It exclusively operates on issue data (nodes map 1:1 to issues via
  `issue_id`).
- The API shares scope params (`organization_id`, `team_id`) with issues
  filters.
- No other feature needs to import critical-path types.

---

## API Layer (`features/issues/api/critical-path.ts`)

```ts
// features/issues/api/critical-path.ts
'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';
import type { CriticalPathGraph } from '../model/types';
import type { ActionResult } from '@/shared/types/server-action';

type Scope = { team_id?: number; organization_id?: number };

export async function getCriticalPath(
  scope: Scope,
): Promise<CriticalPathGraph | null> {
  // Returns null on 404 (not yet computed).
  // Throws ServerError on 5xx. Let error boundary handle it.
  const params = new URLSearchParams();
  if (scope.team_id) params.set('team_id', String(scope.team_id));
  if (scope.organization_id)
    params.set('organization_id', String(scope.organization_id));

  const { data } = await httpClient<CriticalPathGraph>(
    `${API_URL}/critical-path?${params.toString()}`,
  );
  return data; // null when backend returns success:false / 404
}

export async function rebuildCriticalPath(
  scope: Scope,
): Promise<ActionResult<{ status: string; graph_id: number }>> {
  // POST — mutation that returns ActionResult so the client can handle the error inline.
  try {
    const { data } = await httpClient<{ status: string; graph_id: number }>(
      `${API_URL}/critical-path/rebuild`,
      {
        method: 'POST',
        body: JSON.stringify(scope),
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to rebuild critical path',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
```

**Important:** `getCriticalPath` handles the 404 case by checking
`data === null` (the `httpClient` envelope returns `data: null` when
`success: false`). It does **not** need a try/catch — a 404 from the backend
becomes `{ data: null }` in the envelope, not an exception from `httpClient`.

---

## Types (`features/issues/model/types.ts` additions)

```ts
export type CriticalPathStatus = 'pending' | 'computing' | 'ready' | 'failed';
export type CriticalPathEdgeType = 'explicit' | 'implicit' | 'sentinel';

export interface CriticalPathNode {
  node_id: number;
  node_type: 'issue';
  issue_id: number;
  issue_name: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  duration_days: number;
  early_start: number | null;
  early_finish: number | null;
  late_start: number | null;
  late_finish: number | null;
  slack: number | null;
  is_critical: boolean;
}

export interface CriticalPathEdge {
  from_node_id: number;
  to_node_id: number;
  edge_type: CriticalPathEdgeType;
}

export interface CriticalPathGraph {
  graph_id: number;
  team_id: number | null;
  organization_id: number | null;
  status: CriticalPathStatus;
  computed_at: string | null;
  project_duration_days: number;
  nodes: CriticalPathNode[];
  edges: CriticalPathEdge[];
}
```

---

## Page Shell (`app/dashboard/today/critical-path/page.tsx`)

```tsx
// Server Component — passes scope from searchParams down to the Client Component
export default async function CriticalPathPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const orgId = params.organization_id
    ? Number(params.organization_id)
    : undefined;
  const teamId = params.team_id ? Number(params.team_id) : undefined;

  return <CriticalPathPageClient organizationId={orgId} teamId={teamId} />;
}
```

---

## Client Component Orchestrator (`features/issues/ui/critical-path-page.tsx`)

This is the main `'use client'` component. It owns:

1. **State**: `graph: CriticalPathGraph | null`, `loading: boolean`,
   `notFound: boolean`, `selectedNodeId: number | null`
2. **Polling**: `useEffect` that runs `getCriticalPath` and re-schedules via
   `setTimeout` while `status === 'pending' | 'computing'`. Stops on `ready` or
   `failed`. Interval: 3 seconds.
3. **Rebuild**: calls `rebuildCriticalPath`, then starts polling.
4. **Layout**: three-column layout matching design:
   - Left sidebar: issue list sorted by `early_start` (collapsible on mobile)
   - Center: `<CriticalPathGraph>` SVG canvas
   - Right: `<CriticalPathNodeDetail>` slide-in panel when
     `selectedNodeId !== null`

**States to handle:**

| State                                 | UI                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Initial load                          | Full-area skeleton with pulsing                                         |
| `notFound` (404)                      | Empty state: "No critical path computed" + "Build Critical Path" button |
| `status === 'computing' \| 'pending'` | Overlay progress indicator on top of (stale) graph or skeleton          |
| `status === 'ready'`                  | Full graph rendered                                                     |
| `status === 'failed'`                 | Error state with message + "Rebuild" button                             |
| `ready` with 0 nodes                  | "No active open/in-progress issues found" empty state                   |

---

## Graph Component (`features/issues/ui/critical-path-graph.tsx`)

Pure rendering Client Component. Receives `nodes`, `edges`, `selectedNodeId`,
`onSelectNode`. Handles pan/zoom/click internally.

### Layout Algorithm

The design uses a **column-per-level (longest path)** layout:

- Level of a node = `max(level of all predecessors) + 1`, starting from 0 for
  roots
- Nodes in the same column are spaced vertically, columns centered
- Node dimensions: 192×68px (matching design), horizontal gap: 110px, vertical
  gap: 24px

### Edge Rendering

Filter edges before render:

```ts
const nodeIds = new Set(nodes.map((n) => n.node_id));
const renderableEdges = edges.filter(
  (e) => nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id),
);
```

Edge types:

- Critical path edges (`is_critical` both endpoints): orange stroke `#ff7043`
  with glow filter + arrow marker
- Normal edges: muted border color `hsl(var(--border))` with arrow
- Selected node's incoming edges: highlighted in blue `#60a5fa` dashed

### Node Card (SVG `<g>`)

Each node renders as an SVG group:

- Background rect: `bg-card` color (`hsl(240 30% 7%)`)
- Border: `#ff7043` for critical, `hsl(var(--border))` for normal, `#60a5fa` for
  selected
- Left accent bar (3px wide): orange for critical, status color otherwise
- Text rows: issue name (truncated at 20 chars), `ES:X EF:X duration_days d`
- Status dot (top-right): color-coded (`#34d399` done, `#60a5fa` in_progress,
  muted todo)
- Slack badge (bottom-right): orange `#ff7043` background when `slack === 0`,
  muted otherwise
- Glow filter for critical nodes

### Pan / Zoom

- Wheel → zoom (clamp 0.25–3×)
- Mouse drag on background → pan
- Click on node → `onSelectNode(node_id)` (deselects on second click)
- Auto-center on mount: calculate scale to fit all nodes in viewport
- Zoom controls: +/−/fit buttons (bottom-left)
- Dot-grid background pattern (SVG `<pattern>`)

### Legend

Bottom-right floating panel (`position: absolute`):

- Orange line → Critical path
- Muted line → Dependency
- Color dots → Done / In Progress / Open

---

## Node Detail Panel (`features/issues/ui/critical-path-node-detail.tsx`)

Right panel that slides in when a node is selected. Matches the design's "detail
panel":

**Sections:**

1. **Header**: issue name, status pill (`IssueStatusBadge`), critical pill
   (`⚡ Critical` in orange) if `is_critical`
2. **CPM Parameters** (2-column grid):
   - Duration (days)
   - Slack (days) — orange text + border when `slack === 0`
   - Early Start (ES)
   - Early Finish (EF)
   - Late Start (LS)
   - Late Finish (LF)
3. **Due date** if present
4. **Dependencies** (nodes that this node depends on): list of clickable dep
   items, each showing issue name + critical indicator
5. **Blocks** (nodes that depend on this): same style
6. **Navigation link**: "Open issue →" linking to `/dashboard/issues/[issue_id]`

The panel uses existing `Card`, `CardBody` components styled with project tokens
— no raw hex colors.

---

## Top Bar Summary Chips

At the top of the page, a summary row (matching design's "stat chips"):

- Total issues in graph
- Critical count (orange badge)
- Project duration (days)
- `computed_at` freshness timestamp ("Updated 3 min ago")
- Rebuild button

Use existing `Badge` or a simple styled `<div>` consistent with the project's UI
kit.

---

## Scope Selection

The critical path is organization or team scoped. Two approaches:

1. **Option A** (simpler): Read `organization_id` and/or `team_id` from URL
   `searchParams`. User can pass them via the existing filters bar or the URL.
2. **Option B**: Auto-detect from user's organization context via
   `getOrganizations()` and default to the first org.

**Recommended: Option A** — consistent with how issues/(list)/list/page.tsx does
it. The `SharedFiltersBar` already passes `organization_id` / `team_id` as query
params. If neither is in the URL, show a "Select an organization or team scope"
prompt.

---

## New Tab in Today Navigation

Add a new tab to `today-tabs-nav.tsx`:

```ts
{ href: ROUTES.DASHBOARD.TODAY_CRITICAL_PATH, label: 'Critical Path', match: 'exact' as const }
```

And in `routes.ts`:

```ts
TODAY_CRITICAL_PATH: '/dashboard/today/critical-path',
```

**Note**: The current `activity` tab is specifically for viewing agent task
activity (requires `?taskId=...`). The critical path graph is a standalone view
— adding it as a 4th "today" sub-tab is consistent with the tab pattern. The tab
name "Critical Path" is descriptive and English, consistent with existing tab
labels ("Meetings", "Tasks", "Activity").

---

## Acceptance Criteria

- [ ] `GET /api/v1/critical-path` is called on mount with scope from
      searchParams
- [ ] 404 response → empty state with "Build Critical Path" button
- [ ] `POST /api/v1/critical-path/rebuild` is called on button click, polling
      starts
- [ ] While `status === 'computing' | 'pending'` → loading overlay, poll every
      3s
- [ ] `status === 'ready'` → graph renders with all nodes and edges
- [ ] `status === 'failed'` → error state with rebuild button
- [ ] Critical path nodes highlighted in orange (`#ff7043`), non-critical in
      muted color
- [ ] Critical path edges rendered with glow effect, non-critical edges muted
- [ ] Sentinel edges (referencing missing nodes) are filtered out
- [ ] Node click opens detail panel on the right
- [ ] Detail panel shows all 6 CPM values (ES, EF, LS, LF, duration, slack)
- [ ] Slack = 0 highlighted in orange in detail panel
- [ ] "Open issue" link navigates to `/dashboard/issues/[issue_id]`
- [ ] Pan/zoom works (wheel, drag, +/−/fit buttons)
- [ ] Summary chips show: total nodes, critical count, project duration,
      computed_at
- [ ] No `any` types; all API response fields typed
- [ ] `'use server'` in `critical-path.ts` API file
- [ ] Route added to `routes.ts`, tab added to `today-tabs-nav.tsx`
- [ ] `loading.tsx` present for the sub-route
- [ ] New types exported from `features/issues/index.ts`
- [ ] All UI text in English

---

## File Checklist

```
shared/lib/routes.ts                                     → add TODAY_CRITICAL_PATH
features/today-briefing/ui/today-tabs-nav.tsx            → add Critical Path tab
app/dashboard/today/critical-path/
  page.tsx                                               → new Server Component shell
  loading.tsx                                            → new skeleton loader
features/issues/
  api/critical-path.ts                                   → new server actions
  model/types.ts                                         → add CPM types (4 types)
  ui/critical-path-graph.tsx                             → new interactive SVG
  ui/critical-path-node-detail.tsx                       → new detail panel
  ui/critical-path-page.tsx                              → new page orchestrator
  index.ts                                               → export new types/components
```

---

## References

- Design reference: `/Users/slavapopov/Downloads/Critical Path.html`
- Backend commit: `4a3f80c2955078ed0e1e9a08f39f92878b034de7`
- Backend API routes:
  `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php`
- Pattern reference for searchParams scope:
  `app/dashboard/issues/(list)/list/page.tsx`
- Tab navigation pattern: `features/today-briefing/ui/today-tabs-nav.tsx`
- Polling pattern: implement with `useEffect` + `useRef` for cleanup (no
  dedicated polling library needed)
