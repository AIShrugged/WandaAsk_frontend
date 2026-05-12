# Slash Commands Reference

Quick reference for all available slash commands in Claude Code for this
project. Each command reads relevant existing code before generating output —
always pass a specific argument.

---

## Code Generation

| Command       | Argument format                             | What it creates                                                                            |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/feature`    | `<feature-name>`                            | Complete FSD feature module: `ui/`, `model/`, `api/`, `hooks/`, `types.ts`, `index.ts`     |
| `/page`       | `<route-path>`                              | Next.js App Router page at `app/<route-path>/page.tsx` (+ optional `layout.tsx`)           |
| `/component`  | `<feature/Name>` or `shared/Name`           | React component with props interface, Tailwind, correct Server/Client placement            |
| `/widget`     | `<widget-name>`                             | Composite widget in `widgets/<name>/ui/` combining multiple features                       |
| `/entity`     | `<entity-name>`                             | Domain entity: `model/types.ts`, `model/schemas.ts`, `model/constants.ts`, `ui/`, `lib/`   |
| `/form`       | `<feature/FormName>`                        | Form component + Zod schema + Server Action returning `ActionResult<T>`                    |
| `/hook`       | `<feature/useHookName>` or `shared/useName` | Custom React hook with typed return interface                                              |
| `/action`     | `<feature/actionName>`                      | Server Action using `httpClient` from `shared/lib/httpClient`, returning `ActionResult<T>` |
| `/store`      | `<feature/storeName>` or `shared/storeName` | Zustand store with typed interface and granular selectors                                  |
| `/api-route`  | `<path> <METHOD>`                           | Next.js API Route Handler at `app/api/<path>/route.ts`                                     |
| `/middleware` | `<purpose>`                                 | Create or update `middleware.ts` at project root                                           |

---

## Quality & Review

| Command     | Argument            | What it does                                                               |
| ----------- | ------------------- | -------------------------------------------------------------------------- |
| `/review`   | `[file or feature]` | Reviews for FSD boundaries, TypeScript, SSR, security, Zod v4, performance |
| `/fix`      | `[file or dir]`     | Runs ESLint + `tsc --noEmit`, fixes all reported issues                    |
| `/build`    | _(none)_            | Runs `tsc`, `lint`, `build` in order; fixes all errors                     |
| `/test`     | `<file or feature>` | Writes Jest + RTL tests; includes correct mocks for this project           |
| `/a11y`     | `[page or feature]` | Audits semantic HTML, ARIA, keyboard nav, contrast                         |
| `/optimize` | `[file or feature]` | Audits `'use client'` usage, bundle size, re-renders, caching              |
| `/refactor` | `<file or feature>` | Refactors for FSD compliance, component decomposition, code quality        |
| `/security` | `[scope]`           | OWASP Top 10 audit, input validation, auth/authz checks                    |

---

## Tips

- **Always provide an argument** — e.g. `/component issues/IssueCard`, not just
  `/component`.
- `/feature` and `/page` are the entry points for new work; they scaffold
  everything you need.
- `/action` and `/form` always read the backend contract before writing
  TypeScript — see `CLAUDE.md` for the backend workflow.
- Run `/fix` before committing; run `/build` before pushing.
- `/review` is a lightweight manual check; for a full pre-push review use the
  `mr-reviewer` agent.
