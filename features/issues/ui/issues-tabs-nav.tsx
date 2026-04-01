'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { segment: 'list', href: ROUTES.DASHBOARD.ISSUES_LIST, label: 'Tasktracker' },
  { segment: 'kanban', href: ROUTES.DASHBOARD.ISSUES_KANBAN, label: 'Kanban' },
] as const;

/**
 * IssuesTabsNav — route-based tab strip for the issues section.
 * Carries current URL filter params when switching tabs.
 */
export function IssuesTabsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();

  return (
    <div className='flex gap-1 border-b border-border px-4'>
      {TABS.map((tab) => {
        const queryString = params ? '?' + params : '';
        const href = tab.href + queryString;
        const isActive = pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.segment}
            href={href}
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
