import { DashboardTabsNav } from '@/features/main-dashboard/ui/dashboard-tabs-nav';

/**
 * MainDashboardLayout — shared layout for main dashboard sub-routes.
 * Renders the route-based tab strip above tab content.
 */
export default function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-5'>
        <DashboardTabsNav />
      </div>
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
