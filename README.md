# Tribes — Frontend

Next.js frontend for the Tribes application. Communicates with a separate
Laravel backend via REST API.

## Stack

- **Next.js 16** (App Router, Turbopack in dev) + **React 19** + **TypeScript**
  (strict)
- **Tailwind CSS v4** — CSS-based config via `@theme inline` in `globals.css`
  (no `tailwind.config.ts`)
- **Zod v4** + **react-hook-form** — form validation
- **Zustand** — client state
- **Recharts** — charts and analytics
- **React Compiler** enabled
- **Jest 30** + **@testing-library/react** — unit and component tests

## Requirements

- Node.js 20.15.0 (see `.nvmrc`)
- npm

## Local development

```bash
# Install dependencies
npm install

# Copy env and fill in values
cp .env.example .env.local

# Start dev server (Turbopack, port 8080)
npm run dev
```

App will be available at `http://localhost:8080`.

### Environment variables

| Variable             | Description                                   |
| -------------------- | --------------------------------------------- |
| `API_URL`            | Laravel backend URL (server-side)             |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for pre-push notifications |
| `TELEGRAM_CHAT_ID`   | Telegram chat ID for pre-push notifications   |

## Commands

```bash
npm run dev        # Dev server with Turbopack (port 8080)
npm run build      # Production build (Webpack)
npm run start      # Run production build
npm run lint       # ESLint check
npm run lint:fix   # ESLint autofix
npm run format     # Prettier format
npm test           # Jest unit tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # With coverage report
npm run push       # Pre-push checks + git push
```

> **Note:** `npm run build` uses Webpack (same as production). Run it locally to
> catch issues that Turbopack may not surface.

## Architecture

Feature Sliced Design (FSD):

```
app/          # Next.js App Router — routing only
features/     # Feature modules (auth, calendar, meetings, issues, agents, ...)
  <feature>/
    ui/       # React components
    model/    # State, schemas, DTO transformations
    api/      # Server Actions and API calls
    hooks/    # Feature-specific hooks
    index.ts  # Public API
entities/     # Domain entities (artifact, event, issue, team, user, ...)
widgets/      # Composite components combining multiple features
shared/
  ui/         # UI kit (Button, Input, Toast, ...)
  lib/        # Utilities, config, routes
  hooks/      # Reusable hooks
  types/      # Shared TypeScript types (ActionResult, PaginatedResult)
deploy/       # Docker, Helm charts, deployment scripts
```

## Testing

Tests live in `__tests__/` directories next to the files they cover. `*.test.ts`
for pure logic, `*.test.tsx` for components.

**Tools:**

| Package                       | Role                                     |
| ----------------------------- | ---------------------------------------- |
| `jest`                        | Test runner                              |
| `@testing-library/react`      | Component rendering                      |
| `@testing-library/user-event` | User interaction simulation              |
| `@testing-library/jest-dom`   | DOM matchers (`toBeInTheDocument`, etc.) |

**Conventions:**

- No `any` in tests; all props and mocks are fully typed
- External dependencies (`next/navigation`, API modules) are mocked with
  `jest.mock()`
- Browser APIs absent in jsdom (e.g. `IntersectionObserver`) are stubbed in
  `beforeAll`

## Production deployment

The app is containerized and deployed via Docker + Kubernetes (Helm).

```bash
# Build image
docker build -t tribes-frontend .

# Run container
docker run -p 3000:3000 \
  -e API_URL=https://api.example.com \
  wanda-frontend
```

Helm charts are located in `deploy/helm/`.
