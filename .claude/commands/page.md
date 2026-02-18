Create a new Next.js App Router page: $ARGUMENTS

The argument should be the route path (e.g., `dashboard/settings` creates `app/dashboard/settings/page.tsx`).

Rules:
- Pages are Server Components by default
- Page contains only routing/layout logic — no business logic
- Business logic, data fetching, and forms belong in the relevant `features/` module
- Import and compose feature components
- If the page needs a layout, also create `layout.tsx` in the same directory
- Follow existing page patterns in `app/` directory
- Use metadata export for SEO when relevant

Look at existing pages first to match the established structure.
