Create a Next.js API Route Handler for: $ARGUMENTS

The argument format is: `<path>/<method>` (e.g., `webhooks/stripe POST` or `auth/callback GET`).

## Rules

- Create in `app/api/<path>/route.ts`
- Export named functions matching HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Use `NextRequest` and `NextResponse` from `next/server`
- Validate request body with Zod v4 schemas
- Return proper HTTP status codes and typed JSON responses
- Handle errors gracefully with try/catch
- Add proper TypeScript types for request/response

## Security
- Validate all input at the boundary
- Use proper CORS headers if needed
- Don't expose internal errors to clients
- Check authentication/authorization where required

## Pattern
```ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // validate with Zod, process, return response
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'message' }, { status: 500 });
  }
}
```

Note: This project primarily uses Server Actions for data mutations. Use API routes only for webhooks, external callbacks, or cases where Server Actions aren't appropriate.
