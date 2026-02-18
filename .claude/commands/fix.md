Fix lint and type errors in the project.

Steps:
1. Run `npm run lint` to find ESLint issues
2. Run `npx tsc --noEmit` to find TypeScript errors
3. Fix all reported issues
4. Run `npm run lint` again to verify fixes
5. Run `npx tsc --noEmit` again to verify type safety

If $ARGUMENTS is provided, only check and fix the specified file or feature directory.

Rules:
- Follow ESLint 9 flat config rules from `eslint.config.mjs`
- Follow Prettier formatting rules from `.prettierrc`
- No `any` types — use proper interfaces
- Do not change behavior, only fix lint/type issues
