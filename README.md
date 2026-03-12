# AI Ask Wanda — Frontend

Next.js frontend for the AI Ask Wanda application. Communicates with a separate
Laravel backend via REST API.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — CSS-based config via `@theme` in `globals.css`
- **Zod v4** + **react-hook-form** — form validation
- **Zustand** — client state
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
cp .env.local.example .env.local

# Start dev server (Turbopack, port 8080)
npm run dev
```

App will be available at `http://localhost:8080`.

### Environment variables

| Variable              | Description                       |
| --------------------- | --------------------------------- |
| `API_URL`             | Laravel backend URL (server-side) |
| `NEXT_PUBLIC_API_URL` | Laravel backend URL (client-side) |
| `NEXT_PUBLIC_WS_URL`  | WebSocket server URL              |

## Commands

```bash
npm run dev        # Dev server with Turbopack
npm run build      # Production build (Webpack)
npm run start      # Run production build
npm run lint       # ESLint check
npm run lint:fix   # ESLint autofix
npm run format     # Prettier format
npm test           # Jest tests
npm test -- --watch          # Watch mode
npm test -- --coverage       # With coverage report
npm test -- schemas          # Filter by file name
```

> **Note:** `npm run build` uses Webpack (same as production). Run it locally to
> catch issues that Turbopack may not surface.

## Architecture

Feature Sliced Design (FSD):

```
app/          # Next.js App Router — routing only
features/     # Feature modules (auth, calendar, meeting, transcript, ...)
  <feature>/
    ui/       # React components
    model/    # State, schemas, DTO transformations
    api/      # Server Actions and API calls
    hooks/    # Feature-specific hooks
    index.ts  # Public API
entities/     # Domain entities
widgets/      # Composite components
shared/
  ui/         # UI kit (Button, Input, Toast, ...)
  api/        # API client, session
  lib/        # Utilities, config, routes
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
| `@types/jest`                 | TypeScript types for Jest globals        |

**What is covered:**

- Zod schemas (`features/chat/model/__tests__/`)
- UI components: `CollapsedSidePanel`, `ThinkingIndicator`, `ChatMessage`,
  `ChatList`

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
docker build -t wanda-frontend .

# Run container
docker run -p 3000:3000 \
  -e API_URL=https://api.example.com \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  wanda-frontend
```

Helm charts are located in `deploy/helm/`.
