# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project

AI Ask Wanda — frontend application. Next.js 16 + TypeScript + React 19. Backend
is a separate PHP/Laravel app accessed via API.

Repository: `git.fabit.ru/tribes/ai_ask_wanda-frontend`

## Backend Repository

The backend lives at **`/Users/slavapopov/Documents/WandaAsk_backend`** (Laravel
12 / PHP 8.2).

**When to consult backend code — MANDATORY in these cases:**

- Implementing or updating a Server Action / API call → read the actual
  controller and FormRequest first
- Typing an API response → read the Resource class to get exact field names and
  types
- Debugging a 4xx/5xx → read the controller, Policy, and AppException handler
- Adding a new feature that touches an API endpoint → read routes/api.php to
  confirm the route exists and its method/prefix

**How to navigate the backend:**

| What you need                      | Where to look                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Route list & URL structure         | `/Users/slavapopov/Documents/WandaAsk_backend/routes/api.php` (REST) · `routes/ai.php` (MCP/AI)                               |
| Request params & validation rules  | `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Requests/API/v1/<Name>Request.php`                                     |
| Response field names & types       | `/Users/slavapopov/Documents/WandaAsk_backend/app/Http/Resources/API/v1/<Name>Resource.php` for Resource-based endpoints      |
| Response field names & types (DTO) | `/Users/slavapopov/Documents/WandaAsk_backend/app/Domain/DTO/<Domain>/<Name>DTO.php` — check controller to know which applies |
| Business logic                     | `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/<Domain>/<Name>Service.php`                                        |
| Domain error codes                 | `/Users/slavapopov/Documents/WandaAsk_backend/app/Domain/Errors/`                                                             |
| Models & relations                 | `/Users/slavapopov/Documents/WandaAsk_backend/app/Models/<Name>.php`                                                          |
| Enum values (valid strings)        | `/Users/slavapopov/Documents/WandaAsk_backend/app/Enums/<Name>.php`                                                           |
| Agent tools (AI capabilities)      | `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/Tools/`                                                      |
| Artifact type schemas              | `/Users/slavapopov/Documents/WandaAsk_backend/app/Services/Agent/Tools/CreateArtifactTool.php`                                |

**Backend response envelope** — every endpoint returns this shape:

```ts
interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message: string;
  status: number;
  meta: Record<string, unknown>;
}
```

Paginated list endpoints additionally return an `Items-Count` response header
with the total count.

**Auth** — Laravel Sanctum token. All authenticated requests send
`Authorization: Bearer <token>`.

**Error codes** — the backend throws `AppException` with a machine-readable
`errorCode` string (e.g. `USER_ALREADY_IN_TEAM`, `AI_REQUEST_FAILED`). Read
`app/Domain/Errors/` for all codes in a domain area.

**Rule: before writing any TypeScript type/interface for an API response, read
the corresponding `*Resource.php` or `*DTO.php` in the backend (check the
controller to know which one is used). Never guess or infer field names from
context.**

## Backend MCP Server

The backend exposes a live MCP server with 14 HR/AI tools.

**Endpoint:** `https://dev-api.shrugged.ai/mcp` **Auth:**
`Authorization: Bearer <sanctum-token>` **Config:** `.mcp.json` →
`wanda-backend` server entry

**Available tools (use via `wanda-backend` MCP):**

| Tool                                 | When to use                                                     |
| ------------------------------------ | --------------------------------------------------------------- |
| `get_user_info`                      | Lookup user by id/email/name — get `profile_id` for other tools |
| `get_user_insights`                  | Full psychological/behavioral profile of a user                 |
| `search_meetings`                    | Find meetings by title, date range, participant                 |
| `get_meeting_summary`                | AI summary, decisions, key points for a meeting                 |
| `get_followup`                       | DISC/360 follow-up assessments after a meeting                  |
| `get_tasks`                          | List tasks by meeting or assignee                               |
| `create_task` / `update_task_status` | Task management                                                 |
| `get_transcript`                     | Full meeting transcript (expensive — confirm with user first)   |
| `get_team_members`                   | Members of a team by id or name                                 |
| `get_relationship_insight`           | Interaction dynamics between two people                         |
| `get_extracted_facts`                | Raw AI-extracted facts from transcripts/Telegram                |

**To get a Sanctum token:**

```bash
curl -X POST https://dev-api.shrugged.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
# Copy the token from response → paste into .mcp.json wanda-backend.headers.Authorization
```

## Backend ↔ Frontend Workflow

### Adding a new API feature — mandatory checklist:

1. **Read routes** → `routes/api.php` — confirm route exists, check HTTP method
   and prefix
2. **Read controller** → identify which Resource or DTO is returned
3. **Read Resource/DTO** → map every field to TypeScript
4. **Read FormRequest** → map validation rules to Zod schema
5. **Read Enums** → translate PHP backed-enum cases to TypeScript union
6. **Write TypeScript types** in `features/<name>/types.ts`
7. **Write Zod schema** in `features/<name>/model/schemas.ts`
8. **Write Server Action** in `features/<name>/api/<resource>.ts`
9. **Run backend-contract-validator** agent to verify no mismatches

### Debugging a contract mismatch:

```
Symptom: field is undefined at runtime / wrong type
→ Run: backend-contract-validator agent on the domain
→ Or manually: read <Name>Resource.php toArray() → compare with TypeScript interface
```

### PHP → TypeScript type mapping:

| PHP                         | TypeScript                                      |
| --------------------------- | ----------------------------------------------- |
| `int` / `integer`           | `number`                                        |
| `string`                    | `string`                                        |
| `?string`                   | `string \| null`                                |
| `bool`                      | `boolean`                                       |
| `Carbon` / timestamp        | `string` (ISO 8601)                             |
| `array` (indexed)           | `T[]`                                           |
| `array` (assoc / toArray()) | `Record<string, unknown>` or specific interface |
| Backed enum                 | string union: `'value1' \| 'value2'`            |

## MCP Servers (`.mcp.json`)

Two MCP servers are configured for this project:

### 1. `playwright` — Browser automation

Launches a headless Chromium browser for E2E testing and UI exploration.

**Setup (one time):**

```bash
# Generate auth session first:
npm run test:e2e -- --project=setup
# Now e2e/.auth/user.json exists — playwright MCP will use it for auth
```

**Example prompts:**

- `"Navigate to /dashboard/teams and take a screenshot"`
- `"Fill the create team form with name 'QA Team' and submit"`
- `"Run the auth E2E tests and show me what failed"`
- `"Check if the chat page renders correctly after login"`

**When to use:** UI debugging, visual regression, writing/running E2E tests,
checking what a page looks like without running dev server manually.

### 2. `wanda-backend` — Laravel HR MCP

Direct access to live backend data via 14 AI tools.

**Setup:**

1. Get your Sanctum token (see above)
2. Replace `REPLACE_WITH_SANCTUM_TOKEN` in `.mcp.json`
3. Do NOT commit `.mcp.json` with a real token — use `.mcp.local.json` instead

**Example prompts:**

- `"Find all meetings with Ivan from last week"`
- `"Show me the DISC profile for user with email alice@company.com"`
- `"What tasks were created after the sprint planning meeting?"`
- `"Get the relationship dynamic between Alice and Bob"`

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Local development server
npm run build        # Production build
npm start            # Run production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint autofix
npm run format       # Prettier format
```

## Architecture: Feature Sliced Design (FSD)

```
app/                # Next.js App Router — routing only, no business logic
features/           # Feature-sliced folders (auth/, etc.)
  <feature>/
    ui/             # React components, export via index
    model/          # Business logic, state, DTO transformations, Zod schemas
    api/            # Server Actions and API calls
    hooks/          # Feature-specific hooks
    types.ts        # Feature-specific types
    index.ts        # Public API of the feature
entities/           # Domain entities
shared/             # Shared across features
  ui/               # UI kit components (Button, Input, Checkbox, Toast)
  lib/              # Utilities, helpers
  api/              # Centralized API client
  store/            # Zustand store factories
  hooks/            # Reusable hooks (use-modal, use-popup, use-infinite-scroll)
  types/            # Shared TypeScript types (ActionResult, PaginatedResult)
widgets/            # Composite components combining multiple features
styles/             # Global styles
```

**Key FSD rules:**

- Features are isolated units: UI, logic, API, and types co-located inside each
  feature
- Minimal cross-feature dependencies; shared code goes in `shared/`
- `app/` handles routing only; business logic lives in features
- Each feature exports its public API through `index.ts`

## Tech Stack & Patterns

- **Next.js 16** with App Router, React Compiler enabled, TypeScript
  (`strict: true`)
- **Tailwind CSS v4** — CSS-based config via `@theme inline` in `globals.css`
  (no `tailwind.config.ts`)
- **Zod v4** — API differs from v3: use `z.email()` not `z.string().email()`,
  `z.literal(value, { error })` not `errorMap`
- **react-hook-form + @hookform/resolvers v5** — Zod schemas in `model/`, forms
  use `useForm({ resolver: zodResolver(schema) })`
- **ESLint 9** flat config (`eslint.config.mjs`) + Prettier — enforced via
  Husky + lint-staged pre-commit hooks
- **Server Actions** (`'use server'`) for form submissions and API calls to
  Laravel backend
- **SSR-first**: pages are Server Components; only interactive parts (forms) are
  Client Components

## Key Config Files

- `.env.example` — environment variables template
- `next.config.ts` — Next.js configuration (React Compiler enabled)
- `postcss.config.mjs` — PostCSS with `@tailwindcss/postcss`
- `eslint.config.mjs` / `.prettierrc` — linting and formatting rules
- `tsconfig.json` — TypeScript strict mode, `@/*` path alias to `./*` (project
  root, no `src/`)

## Conventions

- No `any` — define interfaces for all API responses
- SOLID/DRY: small functions, explicit dependencies, dependency inversion via
  params/context
- One abstraction level per file; side effects isolated in hooks
- Maximize SSR: use Server Components by default, `'use client'` only where
  interactivity is required
- Server Actions for data mutations; keep API calls server-side
- Toast notifications via `import { toast } from 'sonner'` — use
  `toast.error(message)` / `toast.success(message)` for network/server errors

## API Layer Conventions (features/\*/api/)

Every file under `features/<name>/api/` **must** follow these rules. No
exceptions.

### Rule 1 — Always `'use server'` at the top

Every `features/<name>/api/*.ts` file must begin with `'use server';`. This
marks all exports as Server Actions, preventing accidental client-side
execution.

### Rule 2 — Use shared HTTP clients, never raw `fetch`

**Do not** call `fetch(...)` directly. Use the clients from
`@/shared/lib/httpClient`:

| Client                             | When to use                                     |
| ---------------------------------- | ----------------------------------------------- |
| `httpClient<T>(url, options?)`     | Single-item GET, POST, PUT, PATCH, DELETE       |
| `httpClientList<T>(url, options?)` | List endpoints that return `Items-Count` header |

Both clients handle auth headers, 401 redirect, error logging, and `ServerError`
throwing automatically. Raw `fetch` must only appear in `shared/lib/` itself.

```ts
// ✅ Correct
import { httpClient, httpClientList } from '@/shared/lib/httpClient';

export async function getTeam(id: number) {
  const { data } = await httpClient<TeamProps>(`${API_URL}/teams/${id}`);
  return data;
}

export async function getTeams(orgId: number) {
  return httpClientList<TeamProps>(`${API_URL}/organizations/${orgId}/teams`);
}

// ❌ Wrong — raw fetch, manual auth headers, manual error handling
export async function getTeam(id: number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/teams/${id}`, { headers: authHeaders });
  if (!res.ok) throw new Error(await res.text());
  ...
}
```

### Rule 3 — Action functions (mutations that return errors to UI)

For mutations where the UI needs to handle validation/permission errors without
throwing (forms, modals), return `ActionResult<T>` from
`@/shared/types/server-action`:

```ts
import type { ActionResult } from '@/shared/types/server-action';
import { parseApiError } from '@/shared/lib/apiError';
import { ServerError } from '@/shared/lib/errors';

export async function createTeam(
  payload: TeamCreatePayload,
): Promise<ActionResult<TeamProps>> {
  try {
    const { data } = await httpClient<TeamProps>(`${API_URL}/teams`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to create team',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error; // re-throw unexpected errors
  }
}
```

For read-only actions (GET) that are called from Server Components — just throw,
let the error boundary handle it. Do not wrap in try/catch.

### Rule 4 — File naming and splitting

One file per resource. If a feature has multiple distinct backend resources,
split into separate files:

```
features/agents/api/
  agent-profiles.ts   # /agent-profiles endpoints
  agent-tasks.ts      # /agent-tasks endpoints
  agent-tools.ts      # /agent-tools endpoints
```

Do not put all resources in a single `agents.ts` when there are 3+ distinct
resources with their own CRUD.

### Rule 5 — Revalidation

Call `revalidatePath(...)` after every mutation that changes data visible
elsewhere in the UI. Use the most specific path possible.

```ts
revalidatePath('/dashboard/teams'); // ✅ specific
revalidatePath('/'); // ❌ too broad
```

### Rule 6 — Types live in model/, not api/

Never define types inside `api/` files. All interfaces and types go in:

- `features/<name>/model/types.ts` — feature-local types
- `entities/<name>/model/types.ts` — shared domain types used across features

Import them explicitly; never re-export from `api/`.

### Rule 7 — No private helper functions duplicating shared/lib

Do not write local helper functions that replicate what `httpClient`,
`parseApiError`, `logApiError`, or `ServerError` already do. If a new pattern
appears in multiple api/ files, add it to `shared/lib/httpClient.ts` instead.

## Agent Workflow — When to Use Specialized Agents

Use these agents at the right stages. They are available via the `Agent` tool.

### Starting a new feature

1. **`wanda-backend-navigator`** — before writing any code, read the backend
   contracts (routes, controllers, Resources/DTOs, FormRequests, Enums). Never
   guess field names.
2. **`backend-contract-validator`** — after writing TypeScript types, verify
   they exactly match the backend Resource/DTO.
3. **`frontend-architect`** — for features involving multiple FSD slices,
   complex state, or API integration. Designs the full implementation plan and
   delegates subtasks.

### Writing code

4. **`fsd-boundary-guard`** — after adding or refactoring features, verify FSD
   import boundaries (cross-feature imports, missing index.ts, layer
   violations).
5. **`npm run lint:fix && npm run format`** — before committing, run lint
   autofix and Prettier on changed TS files.

### After implementing

6. **`unit-test-booster`** — after implementing a new component or feature,
   generate Jest + RTL tests.
7. **`e2e-coverage-agent`** — after adding a new route or user flow, generate
   Playwright E2E tests.
8. **`mr-reviewer`** — before committing or pushing, runs a full review: FSD
   boundaries, TypeScript correctness, ESLint, Next.js patterns, test coverage.

### Design & UI

9. **`design-guardian`** — after writing or modifying UI components, audit
   against the design system (cosmic dark theme, violet primary, terminal green
   accent). Check spacing, states, colors.
10. **`artifact-sync`** — when backend adds/changes an artifact type in
    `CreateArtifactTool`, sync frontend renderers.

### Quick reference table

| Stage                         | Agent                        |
| ----------------------------- | ---------------------------- |
| Before touching any API       | `wanda-backend-navigator`    |
| After writing TS types        | `backend-contract-validator` |
| Complex multi-slice feature   | `frontend-architect`         |
| After adding/moving features  | `fsd-boundary-guard`         |
| After writing UI components   | `unit-test-booster`          |
| After adding routes/flows     | `e2e-coverage-agent`         |
| Before commit / push          | `mr-reviewer`                |
| After modifying UI            | `design-guardian`            |
| Backend artifact type changed | `artifact-sync`              |

## FSD Layer Rules

### Import direction (strict)

```
app → features → entities → shared
widgets → features → entities → shared
```

- `features/A` must NOT import from `features/B` — put shared logic in
  `entities/` or `shared/`
- `entities/` must NOT import from `features/`
- `shared/` must NOT import from `entities/` or `features/`
- `app/` imports only from feature `index.ts` public APIs, never deep paths

### Each feature must have index.ts

Every `features/<name>/` and `entities/<name>/` directory must have an
`index.ts` that explicitly re-exports its public API. Consumers import from
`@/features/<name>` — never from deep paths like
`@/features/<name>/model/types`.

Exception: `api/` files are Server Actions — they can be imported directly by
`app/` pages since they are not bundled client-side.

### What goes where

| Code                                            | Layer                            |
| ----------------------------------------------- | -------------------------------- |
| Page layout, routing                            | `app/`                           |
| Feature-specific UI, logic, API                 | `features/<name>/`               |
| Domain types shared across features             | `entities/<name>/model/types.ts` |
| Reusable UI primitives (Button, Input)          | `shared/ui/`                     |
| Generic utilities, HTTP client, logger          | `shared/lib/`                    |
| Composite page sections (use multiple features) | `widgets/`                       |
