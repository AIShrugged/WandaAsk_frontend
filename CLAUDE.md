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
