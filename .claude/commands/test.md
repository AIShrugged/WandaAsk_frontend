Write tests for: $ARGUMENTS

The argument can be a file path, feature name, or component name.

Rules:

- Use Jest + @testing-library/react (already configured in the project)
- Test file goes next to the source file with `.test.ts` or `.test.tsx`
  extension
- Test behavior, not implementation details
- Use `screen.getByRole`, `screen.getByText` for queries (prefer accessible
  selectors)
- Mock Server Actions and API calls
- Follow existing test patterns in the project

## Common mocks (required in most test files)

```ts
jest.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })), usePathname: jest.fn(() => '/') }));
```

## Other patterns to know

- `IntersectionObserver` is not in jsdom — mock via
  `Object.defineProperty(globalThis, 'IntersectionObserver', { value: jest.fn(...) })`
- `aria-hidden="true"` elements need `{ hidden: true }` in `getByRole`
- Async Server Components: `render(await MyComponent(props))`
- `isDev`-gated code: use `jest.resetModules()` + dynamic import to re-evaluate
  module-level constants

After writing tests, run them with:
`npm test -- --testPathPattern=<path-to-test>`

Test infrastructure config: `jest.config.mjs` + `jest.setup.js`.
