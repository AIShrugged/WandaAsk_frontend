Create or update Next.js middleware for: $ARGUMENTS

Examples: `auth`, `redirect`, `locale`, `rate-limit`.

## Rules

- Middleware file location: `middleware.ts` at project root
- Use `NextRequest` and `NextResponse` from `next/server`
- Keep middleware lightweight — it runs on every matched request
- Use `matcher` config to limit which routes trigger the middleware
- Follow Next.js 16 middleware conventions
- Handle auth token/session checks via cookies (not localStorage — middleware is server-side)
- Security headers are already configured in `next.config.ts` — don't duplicate them

## Auth middleware pattern (for this project)
- Check for auth token in cookies
- Redirect unauthenticated users from `/dashboard/*` to `/auth/login`
- Redirect authenticated users from `/auth/*` to `/dashboard`
- Exclude public routes, API routes, and static assets from checks

Look at existing middleware.ts first if it exists. Modify rather than replace.
