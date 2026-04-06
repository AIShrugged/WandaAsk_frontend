'use client';

import { usePathname } from 'next/navigation';
import { type PropsWithChildren, Suspense } from 'react';

import { Skeleton } from '@/shared/ui/layout/skeleton';

const HIDDEN_ON_PATHS = ['/dashboard/chat'];

/**
 * DashboardChatColumn — wraps the chat panel in the dashboard layout.
 * Hides on /dashboard/chat/** routes to avoid duplication.
 * @param root0 - Component props.
 * @param root0.children - The chat panel to render.
 * @returns JSX element or null.
 */
export function DashboardChatColumn({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isHidden = HIDDEN_ON_PATHS.some((p) => {
    return pathname.startsWith(p);
  });

  if (isHidden) return null;

  return (
    <div
      className='hidden xl:flex flex-col flex-shrink-0 border-l border-border/50 overflow-hidden'
      style={{ width: 480 }}
    >
      <Suspense fallback={<Skeleton className='h-full w-full' />}>
        {children}
      </Suspense>
    </div>
  );
}
