import Link from 'next/link';

import { getDashboardData } from '@/features/dashboard/api/dashboard';
import { DashboardStats } from '@/features/dashboard/ui/DashboardStats';
import { RecentChats } from '@/features/dashboard/ui/RecentChats';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

export default async function DashboardPage() {
  const { user, teamsCount, chatsCount, methodologiesCount, recentChats } =
    await getDashboardData();

  return (
    <div className='flex flex-col gap-4 h-full overflow-y-auto p-2'>
      {/* Welcome */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-bold text-foreground'>
          {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome back'}
        </h1>
        <p className='text-sm text-muted-foreground'>
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      {/* Stats */}
      <DashboardStats
        teamsCount={teamsCount}
        chatsCount={chatsCount}
        methodologiesCount={methodologiesCount}
      />

      {/* Recent chats */}
      <Card className='flex flex-col gap-0'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
          <h2 className='text-base font-semibold text-foreground'>Recent Chats</h2>
          <Link
            href={ROUTES.DASHBOARD.CHAT}
            className='text-xs text-primary hover:underline'
          >
            View all
          </Link>
        </div>
        <div className='px-4 py-2'>
          <RecentChats chats={recentChats} />
        </div>
      </Card>

      {/* Quick links */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        {[
          { label: 'Teams', href: ROUTES.DASHBOARD.TEAMS },
          { label: 'Calendar', href: ROUTES.DASHBOARD.CALENDAR },
          { label: 'Methodology', href: ROUTES.DASHBOARD.METHODOLOGY },
          { label: 'Statistics', href: ROUTES.DASHBOARD.STATISTICS },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className='flex items-center justify-center rounded-[var(--radius-card)] border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-card hover:bg-accent transition-colors'
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
