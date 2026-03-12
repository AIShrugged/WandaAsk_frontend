Run a security audit on: $ARGUMENTS

If no argument provided, audit the entire application.

## Checklist

### OWASP Top 10

- **Injection**: Check for unsanitized user input in Server Actions, API routes,
  and dynamic queries
- **XSS**: Verify no `dangerouslySetInnerHTML` without sanitization (check
  `html-react-parser` usage)
- **Auth issues**: Check token storage, session management, middleware
  protection
- **SSRF**: Verify server-side fetch calls don't accept user-controlled URLs
- **Mass assignment**: Check that Server Actions validate/whitelist input fields
  with Zod

### Next.js specific

- Verify security headers in `next.config.ts` (HSTS, X-Frame-Options, CSP, etc.)
- Check `poweredByHeader: false` is set
- Ensure `productionBrowserSourceMaps: false`
- Verify middleware protects authenticated routes
- Check that Server Components don't leak sensitive data to client
- Ensure API keys/secrets are only in server-side code (not in `NEXT_PUBLIC_*`
  env vars)

### Dependencies

- Run `npm audit` for known vulnerabilities
- Check for outdated packages with security patches

### Data handling

- Verify Zod validation on all Server Action inputs
- Check that error messages don't expose internal details
- Verify cookies have proper flags (httpOnly, secure, sameSite)

Report findings as: CRITICAL / HIGH / MEDIUM / LOW with specific file paths and
fixes.
