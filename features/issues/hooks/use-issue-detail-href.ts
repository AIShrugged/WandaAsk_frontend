'use client';

import { usePathname, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Returns a builder function that creates an issue detail href with a `?from=`
 * param encoding the current tab URL and filter state, so the detail page can
 * navigate back to the exact list view the user came from.
 */
export function useIssueDetailHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (issueId: number | string) => {
    const params = searchParams.toString();
    const from = encodeURIComponent(
      params ? `${pathname}?${params}` : pathname,
    );
    return `${ROUTES.DASHBOARD.ISSUES}/${issueId}?from=${from}`;
  };
}
