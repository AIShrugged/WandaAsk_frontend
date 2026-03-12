Analyze and optimize performance for: $ARGUMENTS

If no argument provided, analyze the entire application.

## Checklist

### Server Components vs Client Components

- Audit `'use client'` directives — remove where not needed (no hooks, no event
  handlers, no browser APIs)
- Move data fetching to Server Components, pass data down as props
- Split large Client Components: extract static parts into Server Components,
  keep only interactive parts as Client

### Bundle size

- Check for barrel imports that prevent tree-shaking (import specific modules,
  not entire packages)
- Verify `optimizePackageImports` in `next.config.ts` covers all heavy libraries
- Look for client-side imports of server-only code

### Rendering

- Check for unnecessary `useEffect` — prefer derived state and Server Components
- Verify `useTransition` is used for Server Action calls (as in existing
  `login-form.tsx` pattern)
- Check Zustand stores for excessive re-renders — use selectors
  (`store(s => s.field)`)

### Images

- All images should use `next/image` with proper `width`/`height` or `fill`
- Verify `sizes` prop is set for responsive images
- Check that remote patterns in `next.config.ts` cover all image sources

### Caching & Data

- Verify `staleTimes` configuration is appropriate (currently: dynamic=30s,
  static=180s)
- Check Server Actions use proper revalidation
  (`revalidatePath`/`revalidateTag`)
- Look for duplicate API calls that could be deduplicated

Provide specific findings with file paths and concrete fixes.
