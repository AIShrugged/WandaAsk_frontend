'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

const TABS = [
  { href: ROUTES.DASHBOARD.AGENT_TASKS, label: 'Tasks' },
  { href: ROUTES.DASHBOARD.AGENT_PROFILES, label: 'Profiles' },
  { href: ROUTES.DASHBOARD.AGENT_ACTIVITY, label: 'Activity' },
] as const;

/**
 * AgentsTabsNav — route-based tab strip for the agents section.
 * Active tab is derived from the current pathname.
 */
export function AgentsTabsNav() {
  const pathname = usePathname();

  return (
    <div className='flex gap-1 border-b border-border'>
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
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
