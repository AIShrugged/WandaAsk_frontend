'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { parseDateParam, shiftDate, toDateParam } from '@/shared/lib/date-nav';

interface UseDateNavigationOptions {
  /** When true, preserves all existing search params during navigation */
  preserveParams?: boolean;
}

export function useDateNavigation(
  dateStr: string,
  options: UseDateNavigationOptions = {},
) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const current = parseDateParam(dateStr);

  const navigate = useCallback(
    (offset: number) => {
      const newDateStr = shiftDate(current, offset);

      if (options.preserveParams) {
        const next = new URLSearchParams(params);

        next.set('date', newDateStr);
        router.push(`?${next.toString()}`, { scroll: false });
      } else {
        router.push(`${pathname}?date=${newDateStr}`, { scroll: false });
      }
    },
    [current, options.preserveParams, params, router, pathname],
  );

  const goToday = useCallback(() => {
    if (options.preserveParams) {
      const next = new URLSearchParams(params);

      next.delete('date');
      router.push(`?${next.toString()}`, { scroll: false });
    } else {
      router.push(pathname, { scroll: false });
    }
  }, [options.preserveParams, params, router, pathname]);

  return { current, navigate, goToday, toDateParam };
}
