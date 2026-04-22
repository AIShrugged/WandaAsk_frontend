import { TodayTabsNav } from '@/features/today-briefing';

import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

/**
 * TodayDashboardLayout — shell layout for today dashboard sub-routes.
 * Data fetching happens in each sub-page so searchParams are always fresh.
 */
export default function TodayDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-4'>
        <TodayTabsNav />
      </div>
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
