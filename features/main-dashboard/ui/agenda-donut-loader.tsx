'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';

const AgendaDonutChart = dynamic(
  () => {
    return import('@/features/main-dashboard/ui/agenda-donut-chart').then(
      (m) => {
        return { default: m.AgendaDonutChart };
      },
    );
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-40 rounded-[var(--radius-card)]' />;
    },
  },
);

/**
 * AgendaDonutLoader — SSR-safe dynamic loader for the recharts-based AgendaDonutChart.
 * @param props
 * @param props.agendas
 */
export function AgendaDonutLoader({ agendas }: { agendas: MeetingAgenda[] }) {
  return <AgendaDonutChart agendas={agendas} />;
}
