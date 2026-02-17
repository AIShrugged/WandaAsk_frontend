# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI Ask Wanda — frontend application. Next.js 16 + TypeScript + React 19. Backend is a separate PHP/Laravel app accessed via API.

Repository: `git.fabit.ru/tribes/ai_ask_wanda-frontend`

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
- Features are isolated units: UI, logic, API, and types co-located inside each feature
- Minimal cross-feature dependencies; shared code goes in `shared/`
- `app/` handles routing only; business logic lives in features
- Each feature exports its public API through `index.ts`

## Tech Stack & Patterns

- **Next.js 16** with App Router, React Compiler enabled, TypeScript (`strict: true`)
- **Tailwind CSS v4** — CSS-based config via `@theme inline` in `globals.css` (no `tailwind.config.ts`)
- **Zod v4** — API differs from v3: use `z.email()` not `z.string().email()`, `z.literal(value, { error })` not `errorMap`
- **react-hook-form + @hookform/resolvers v5** — Zod schemas in `model/`, forms use `useForm({ resolver: zodResolver(schema) })`
- **ESLint 9** flat config (`eslint.config.mjs`) + Prettier — enforced via Husky + lint-staged pre-commit hooks
- **Server Actions** (`'use server'`) for form submissions and API calls to Laravel backend
- **SSR-first**: pages are Server Components; only interactive parts (forms) are Client Components

## Key Config Files

- `.env.example` — environment variables template
- `next.config.ts` — Next.js configuration (React Compiler enabled)
- `postcss.config.mjs` — PostCSS with `@tailwindcss/postcss`
- `eslint.config.mjs` / `.prettierrc` — linting and formatting rules
- `tsconfig.json` — TypeScript strict mode, `@/*` path alias to `./src/*`

## Conventions

- No `any` — define interfaces for all API responses
- SOLID/DRY: small functions, explicit dependencies, dependency inversion via params/context
- One abstraction level per file; side effects isolated in hooks
- Maximize SSR: use Server Components by default, `'use client'` only where interactivity is required
- Server Actions for data mutations; keep API calls server-side
- Toast notifications via `useToast()` from `@/shared/ui` for network/server errors
