'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { segment: 'kanban', href: ROUTES.DASHBOARD.TASKS_KANBAN, label: 'Kanban' },
  { segment: 'test', href: ROUTES.DASHBOARD.TASKS_TEST, label: 'Test' },
] as const;

/**
 * TasksTabsNav — route-based tab strip for the tasks section.
 */
export function TasksTabsNav() {
  const pathname = usePathname();

  return (
    <div className='flex gap-1 border-b border-border px-4'>
      {TABS.map((tab) => {
        const isActive =
          tab.segment === 'kanban'
            ? pathname === ROUTES.DASHBOARD.TASKS_KANBAN
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.segment}
            href={tab.href}
            scroll={false}
            className={[
              'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}