'use client';

import { useEffect } from 'react';

import { installClientFetchDebugger } from '@/shared/lib/devFetchInterceptor';

/**
 * Installs the client-side fetch interceptor in development mode.
 * Renders nothing; side-effect only.
 *
 * In production `installClientFetchDebugger` is a no-op, so this component
 * is fully inert — it will also be tree-shaken by Next.js because the
 * `process.env.NODE_ENV !== 'development'` guard evaluates to a constant
 * `false` in production builds.
 */
export function DevDebugProvider(): null {
  useEffect(() => {
    const cleanup = installClientFetchDebugger();

    return cleanup;
  }, []);

  return null;
}
