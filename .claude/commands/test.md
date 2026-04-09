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
- Mock `next/navigation` hooks if needed
- Follow existing test patterns in the project

After writing tests, run them with:
`npm test -- --testPathPattern=<path-to-test>`

If no tests exist yet in the project, set up the test infrastructure following
jest.config.js and jest.setup.js.
