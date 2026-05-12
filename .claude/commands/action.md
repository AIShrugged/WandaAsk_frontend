Create a Server Action for: $ARGUMENTS

The argument format is: `<feature>/<actionName>` (e.g., `auth/login` or
`meeting/createMeeting`).

Rules:

- Create the file in `features/<feature>/api/`
- Add `'use server'` directive at the top of the file
- Define input validation with Zod v4 schema in `features/<feature>/model/`
- Define TypeScript interfaces for request/response types in
  `features/<feature>/types.ts`
- Use `httpClient` or `httpClientList` from `@/shared/lib/httpClient` for HTTP
  calls — never raw `fetch` and never `shared/api/`
- For mutations: return `ActionResult<T>` from `@/shared/types/server-action` so
  the UI can handle validation/permission errors without throwing
- For read-only GET calls from Server Components: just throw, let the error
  boundary handle it
- Call `revalidatePath(...)` after every mutation that changes visible data
- Handle errors gracefully, return typed results
- Follow patterns from existing Server Actions in the project
- Update barrel exports in `index.ts`

Look at existing actions in the codebase first to match the established
patterns.
