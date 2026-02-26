/**
 * Next.js Instrumentation hook.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Called once when the Node.js server process starts.
 * We use it to install a global fetch debugger for server-side requests in
 * development. The hook is a no-op in production and in the Edge runtime.
 */

export async function register(): Promise<void> {
  // Guard 1: production build — exit immediately, zero overhead.
  if (process.env.NODE_ENV !== 'development') return;

  // Guard 2: Edge runtime — has its own fetch implementation; don't patch.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { patchServerFetch } = await import('@/shared/lib/fetchDebugger');
  patchServerFetch();
}
