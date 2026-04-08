'use client';

import { useParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

/**
 * FollowUpTabsNav — route-based tab strip for the follow-up analysis detail page.
 * Builds tab hrefs dynamically based on the current [id] param.
 */
export function FollowUpTabsNav() {
  const { id } = useParams<{ id: string }>();
  const base = `${ROUTES.DASHBOARD.FOLLOWUPS}/analysis/${id}`;

  const TABS = [
    { href: `${base}/summary`, label: 'Overview' },
    { href: `${base}/analysis`, label: 'Follow-up' },
    { href: `${base}/transcript`, label: 'Transcript' },
    { href: `${base}/tasks`, label: 'Tasks' },
  ];

  return <PageTabsNav tabs={TABS} />;
}
