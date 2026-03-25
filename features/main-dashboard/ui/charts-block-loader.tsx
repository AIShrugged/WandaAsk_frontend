'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { DashboardApiResponse } from '@/features/summary/types';

const ChartsBlock = dynamic(
  () => {
    return import('@/features/main-dashboard/ui/charts-block').then((m) => {
      return { default: m.ChartsBlock };
    });
  },
  {
    ssr: false,
    // eslint-disable-next-line jsdoc/require-jsdoc
    loading: () => {
      return <Skeleton className='h-64 rounded-[var(--radius-card)]' />;
    },
  },
);

/**
 * ChartsBlockLoader — SSR-safe dynamic loader for recharts-based ChartsBlock.
 * @param props
 * @param props.summary
 */
export function ChartsBlockLoader({
  summary,
}: {
  summary: DashboardApiResponse;
}) {
  return <ChartsBlock summary={summary} />;
}
