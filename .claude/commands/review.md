Review the code changes and provide feedback.

If $ARGUMENTS is provided, review the specified file or feature. Otherwise, review all uncommitted changes (`git diff`).

Review checklist:
1. **FSD Architecture** — features isolated, no cross-feature imports, shared code in `shared/`
2. **TypeScript** — no `any`, proper interfaces, strict mode compliance
3. **SSR** — Server Components by default, `'use client'` only where needed
4. **Security** — no XSS, injection, or OWASP Top 10 vulnerabilities
5. **Zod v4** — correct API usage (`z.email()`, not `z.string().email()`)
6. **Performance** — no unnecessary re-renders, proper memoization only when needed
7. **Conventions** — SOLID/DRY, small functions, one abstraction level per file
8. **Tailwind CSS v4** — proper utility classes, no deprecated patterns
9. **Error handling** — toast notifications for user-facing errors, proper Server Action error handling

Provide specific, actionable feedback with file paths and line numbers. Categorize issues as: critical, warning, or suggestion.
