import { notFound } from 'next/navigation';

import { DebugTabsNav } from '@/features/debug';
import { isDev } from '@/shared/lib/logger';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { ReactNode } from 'react';

/**
 * DebugLayout — shared layout for all debug sub-routes.
 * Hidden in production. Renders page card with header and route-based tab strip.
 */
export default function DebugLayout({ children }: { children: ReactNode }) {
  if (!isDev) notFound();

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Debug' />
      <div className='flex flex-col h-full overflow-hidden'>
        <DebugTabsNav />
        <div className='flex-1 overflow-hidden'>{children}</div>
      </div>
    </Card>
  );
}
