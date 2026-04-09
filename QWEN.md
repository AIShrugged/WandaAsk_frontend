# WandaAsk Frontend — QWEN Context

## Project Overview

**AI Ask Wanda** — a Next.js 16 frontend application for an HR/AI platform. It
communicates with a separate Laravel 12 PHP backend (located at
`/Users/slavapopov/Documents/WandaAsk_backend`) via REST API.

- **Name:** `spodial_hr_frontend` (v0.1.0)
- **Repository:** `git.fabit.ru/tribes/ai_ask_wanda-frontend`
- **Architecture:** Feature Sliced Design (FSD) with Next.js App Router
- **Backend:** Laravel 12 / PHP 8.2 at
  `/Users/slavapopov/Documents/WandaAsk_backend`

## Tech Stack

| Category         | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | Next.js 16 (App Router)                |
| UI Library       | React 19                               |
| Language         | TypeScript 5 (strict mode)             |
| Styling          | Tailwind CSS v4 (CSS-based config)     |
| Animations       | Framer Motion / Motion                 |
| Charts           | Recharts                               |
| Forms            | react-hook-form + @hookform/resolvers  |
| Validation       | Zod v4                                 |
| State Management | Zustand                                |
| Notifications    | Sonner                                 |
| Icons            | Lucide React                           |
| Markdown         | react-markdown + remark-gfm            |
| Linting          | ESLint 9 + Prettier                    |
| Testing (Unit)   | Jest 30 + @testing-library/react       |
| Testing (E2E)    | Playwright                             |
| Pre-commit       | Husky + lint-staged                    |
| Build            | Turbopack (dev) / Webpack (production) |

## Directory Structure

```
app/                # Next.js App Router — routing only, no business logic
features/           # Feature-sliced modules (25 modules)
  <feature>/
    ui/             # React components (export via index.ts)
    model/          # Business logic, state, DTO transformations, Zod schemas
    api/            # Server Actions ('use server') and API calls
    hooks/          # Feature-specific hooks
    types.ts        # Feature-specific types
    index.ts        # Public API of the feature
entities/           # Domain entities (artifact, event, organization, participant, source, team, user)
widgets/            # Composite components combining multiple features
  calendar-view/
  layout/
  meeting/
shared/             # Shared across features (no business logic)
  ui/               # UI kit components (Button, Input, Checkbox, Toast, etc.)
  lib/              # Utilities, helpers, HTTP clients
  api/              # Centralized API client
  store/            # Zustand store factories
  hooks/            # Reusable hooks (use-modal, use-popup, use-infinite-scroll)
  types/            # Shared TypeScript types (ActionResult, PaginatedResult)
e2e/                # Playwright E2E tests
eslint-rules/       # Custom ESLint rules
scripts/            # Utility scripts (pre-push checks, etc.)
styles/             # Global styles (globals.css in app/)
deploy/             # Docker/Helm deployment configs
```

### Key FSD Rules

- **Import direction (strict):** `app → widgets → features → entities → shared`
- `features/A` must NOT import from `features/B` — put shared logic in
  `entities/` or `shared/`
- `entities/` must NOT import from `features/`
- `shared/` must NOT import from `entities/` or `features/`
- `app/` imports only from feature `index.ts` public APIs, never deep paths
- Each feature/entities directory must have an `index.ts` re-exporting its
  public API
- Exception: `api/` files (Server Actions) can be imported directly by `app/`
  pages

## Commands

### Development

```bash
npm install              # Install dependencies
npm run dev              # Dev server (Turbopack, port 8080)
npm run build            # Production build (Webpack)
npm run start            # Run production build
npm run prod             # Full rebuild + start (production)
```

### Testing

```bash
npm test                 # Jest unit tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage report
npm test -- schemas      # Filter by filename

npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright E2E with UI
npm run test:e2e:report  # Show HTML report
```

### Code Quality

```bash
npm run lint             # ESLint check
npm run lint:fix         # ESLint autofix
npm run format           # Prettier format
npm run typecheck        # TypeScript type check (no emit)
```

### Other

```bash
npm run prepare          # Install Husky hooks
npm run push             # Push with pre-push checks (scripts/push.sh)
npm run dev:container    # Build + start for container development
```

## Environment Variables

| Variable              | Description                          |
| --------------------- | ------------------------------------ |
| `API_URL`             | Laravel backend URL (server-side)    |
| `NEXT_PUBLIC_API_URL` | Laravel backend URL (client-side)    |
| `NEXT_PUBLIC_WS_URL`  | WebSocket server URL                 |
| `NEXT_PUBLIC_APP_ENV` | App environment (development/prod)   |
| `TELEGRAM_BOT_TOKEN`  | Telegram bot for push notifications  |
| `TELEGRAM_CHAT_ID`    | Telegram chat for push notifications |

Copy `.env.example` to `.env.local` and fill in values.

## Building and Running

### Local Development

```bash
npm install
cp .env.example .env.local   # Edit with your values
npm run dev                  # Starts on http://localhost:8080
```

### Docker

```bash
docker build -t wanda-frontend .
docker run -p 3000:3000 \
  -e API_URL=https://api.example.com \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  wanda-frontend
```

### Deployment

Deployed via GitLab CI/CD to Kubernetes (ArgoCD). Two environments:

- **dev:** `spodial-hr-dev`
- **prod:** `spodial-hr-prod`

Helm charts are in `deploy/helm/`.

## API Layer Conventions

All files under `features/<name>/api/` must:

1. Start with `'use server';` directive
2. Use shared HTTP clients from `@/shared/lib/httpClient` — **never raw
   `fetch`**
   - `httpClient<T>(url, options?)` — single-item GET, POST, PUT, PATCH, DELETE
   - `httpClientList<T>(url, options?)` — list endpoints returning `Items-Count`
     header
3. Return `ActionResult<T>` from `@/shared/types/server-action` for mutations
4. Call `revalidatePath(...)` after mutations that change visible data
5. Keep types in `model/types.ts`, not in `api/` files
6. One file per resource; split distinct resources into separate files

### Backend Response Envelope

Every endpoint returns:

```ts
interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message: string;
  status: number;
  meta: Record<string, unknown>;
}
```

Paginated list endpoints additionally return an `Items-Count` response header.

**Auth:** Laravel Sanctum Bearer token. All authenticated requests send
`Authorization: Bearer <token>`.

## Backend Contract Workflow

### When to consult backend code (MANDATORY):

- Implementing or updating a Server Action / API call
- Typing an API response
- Debugging a 4xx/5xx error
- Adding a new feature that touches an API endpoint

### How to navigate the backend:

| What you need                      | Where to look                                      |
| ---------------------------------- | -------------------------------------------------- |
| Route list & URL structure         | `routes/api.php` (REST) · `routes/ai.php` (MCP/AI) |
| Request params & validation rules  | `app/Http/Requests/API/v1/<Name>Request.php`       |
| Response field names & types       | `app/Http/Resources/API/v1/<Name>Resource.php`     |
| Response field names & types (DTO) | `app/Domain/DTO/<Domain>/<Name>DTO.php`            |
| Business logic                     | `app/Services/<Domain>/<Name>Service.php`          |
| Domain error codes                 | `app/Domain/Errors/`                               |
| Models & relations                 | `app/Models/<Name>.php`                            |
| Enum values                        | `app/Enums/<Name>.php`                             |

**Rule: Before writing any TypeScript type/interface for an API response, read
the corresponding `*Resource.php` or `*DTO.php` in the backend. Never guess or
infer field names.**

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

Two MCP servers are configured:

### 1. `playwright` — Browser automation

Headless Chromium for E2E testing.

**Setup:** `npm run test:e2e -- --project=setup` (generates auth session)

### 2. `wanda-backend` — Laravel HR MCP

Live backend data via 14 AI tools (get_user_info, search_meetings, get_tasks,
etc.).

**Setup:** Replace `REPLACE_WITH_SANCTUM_TOKEN` in `.mcp.json` with a Sanctum
token.

## Conventions

- **No `any`** — define interfaces for all API responses
- **SOLID/DRY** — small functions, explicit dependencies, dependency inversion
- **SSR-first** — Server Components by default, `'use client'` only where needed
- **Server Actions** for data mutations; keep API calls server-side
- **Toast notifications** via `import { toast } from 'sonner'`
- **Zod v4** — use `z.email()` not `z.string().email()`,
  `z.literal(value, { error })` not `errorMap`
- **Tailwind CSS v4** — CSS-based config via `@theme inline` in `globals.css`
- **React Compiler** enabled for automatic memoization

## Testing

### Unit Tests (Jest)

- Located in `__tests__/` directories next to files they cover
- `*.test.ts` for pure logic, `*.test.tsx` for components
- External dependencies mocked with `jest.mock()`
- Browser APIs absent in jsdom are stubbed in `beforeAll`

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Auth state saved to `e2e/.auth/user.json` after setup
- Tests run against dev server on `http://localhost:8080`
- Screenshots on failure, trace on first retry

## Code Quality Tools

- **ESLint 9** flat config with plugins: security, sonarjs, unicorn, import,
  boundaries, jsdoc
- **Prettier** for formatting
- **Husky + lint-staged** pre-commit hooks
- **Custom ESLint rules** in `eslint-rules/` (e.g., `use-server-in-api`)
- **FSD boundary enforcement** via `eslint-plugin-boundaries`

## Key Configuration Files

| File                   | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `next.config.ts`       | Next.js config (React Compiler, security headers, image optimization) |
| `tsconfig.json`        | TypeScript strict mode, `@/*` path alias                              |
| `eslint.config.mjs`    | ESLint 9 flat config                                                  |
| `.prettierrc.json`     | Prettier formatting rules                                             |
| `postcss.config.mjs`   | PostCSS with @tailwindcss/postcss                                     |
| `jest.config.mjs`      | Jest test configuration                                               |
| `playwright.config.ts` | Playwright E2E configuration                                          |
| `instrumentation.ts`   | Next.js instrumentation (dev fetch debugger)                          |
| `proxy.ts`             | Server-side proxy configuration                                       |
| `.gitlab-ci.yml`       | CI/CD pipeline (build + ArgoCD deploy)                                |
| `Dockerfile`           | Container build definition                                            |

## Agent Workflow Reference

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

## Project Health (as of March 2026)

- **~530 TypeScript files**, ~40,200 lines of code
- **1,158 unit tests** across 169 test suites (all passing)
- **15 E2E spec files** covering auth, chat, teams, calendar, meeting, profile,
  dashboard, methodology, follow-ups, summary, landing, organization
- **Zero `any`** in production code
- **Zero TODO/FIXME/HACK** comments
- 25 feature modules, 7 entity modules, 3 widget modules
- ESLint with security, sonarjs, unicorn, and FSD boundary plugins
