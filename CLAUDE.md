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
src/
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
- `tsconfig.json` — TypeScript strict mode, `@/*` path alias to `./src/*`

## Conventions

- No `any` — define interfaces for all API responses
- SOLID/DRY: small functions, explicit dependencies, dependency inversion via
  params/context
- One abstraction level per file; side effects isolated in hooks
- Maximize SSR: use Server Components by default, `'use client'` only where
  interactivity is required
- Server Actions for data mutations; keep API calls server-side
- Toast notifications via `useToast()` from `@/shared/ui` for network/server
  errors
