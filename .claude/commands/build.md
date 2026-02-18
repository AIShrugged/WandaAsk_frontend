Build the project and fix all errors.

## Steps

1. Run `npx tsc --noEmit` — fix all TypeScript errors
2. Run `npm run lint` — fix all ESLint issues
3. Run `npm run build` — fix all Next.js build errors
4. If $ARGUMENTS contains "test", also run `npm test`

## Common Next.js build issues to watch for

- Server/Client Component boundary violations (using hooks in Server Components, importing client modules in server context)
- Missing `'use client'` directive on components using hooks or browser APIs
- Server Actions without `'use server'` directive
- Dynamic imports missing `ssr: false` for browser-only libraries
- Environment variables not in `next.config.ts` `env` or missing `NEXT_PUBLIC_` prefix
- Image imports without proper `width`/`height`
- Metadata export conflicts with `'use client'`

## Rules
- Fix errors in order: TypeScript first, then ESLint, then build
- Do not suppress errors with `@ts-ignore` or `eslint-disable` — fix the root cause
- If a fix requires architectural changes, describe the issue and proposed fix before applying
