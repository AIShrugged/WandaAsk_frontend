import { TodayTabsNav } from '@/features/today-briefing';

export const dynamic = 'force-dynamic';

/**
 * TodayDashboardLayout — shell layout for today dashboard sub-routes.
 * Data fetching happens in each sub-page so searchParams are always fresh.
 */
export default function TodayDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-5'>
        <TodayTabsNav />
      </div>
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
