/**
 * Next.js Instrumentation hook.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Called once when the Node.js server process starts.
 * We use it to install a global fetch debugger for server-side requests in
 * development. The hook is a no-op in production and in the Edge runtime.
 */

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.APP_ENV === 'development' ||
  process.env.APP_ENV === 'local';

export async function register(): Promise<void> {
  // Guard 1: non-debug environment — exit immediately, zero overhead.
  if (!isDev) return;

  // Guard 2: Edge runtime — has its own fetch implementation; don't patch.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { patchServerFetch } = await import('@/shared/lib/fetchDebugger');
  patchServerFetch();
}
