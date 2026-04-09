'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { DashboardApiResponse } from '@/features/summary/types';

// Recharts uses browser APIs (ResizeObserver) — must be client-only
// Dynamic imports live here in a Client Component so ssr: false is valid
const MeetingStats = dynamic(
  () => {
    return import('@/features/summary/ui/MeetingStats').then((m) => {
      return { default: m.MeetingStats };
    });
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-48 rounded-[var(--radius-card)]' />;
    },
  },
);
const TaskStats = dynamic(
  () => {
    return import('@/features/summary/ui/TaskStats').then((m) => {
      return { default: m.TaskStats };
    });
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-48 rounded-[var(--radius-card)]' />;
    },
  },
);
const FollowupStats = dynamic(
  () => {
    return import('@/features/summary/ui/FollowupStats').then((m) => {
      return { default: m.FollowupStats };
    });
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-48 rounded-[var(--radius-card)]' />;
    },
  },
);
const ParticipantStats = dynamic(
  () => {
    return import('@/features/summary/ui/ParticipantStats').then((m) => {
      return { default: m.ParticipantStats };
    });
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-48 rounded-[var(--radius-card)]' />;
    },
  },
);
const TeamStats = dynamic(
  () => {
    return import('@/features/summary/ui/TeamStats').then((m) => {
      return { default: m.TeamStats };
    });
  },
  {
    ssr: false,
    loading: () => {
      return <Skeleton className='h-48 rounded-[var(--radius-card)]' />;
    },
  },
);

interface StatsSectionProps {
  data: DashboardApiResponse;
}

/**
 * StatsSection component.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function StatsSection({ data }: StatsSectionProps) {
  return (
    <>
      <MeetingStats data={data.meetings} />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <TaskStats data={data.tasks} />
        <FollowupStats data={data.followups} />
      </div>

      <ParticipantStats data={data.participants} />

      <TeamStats data={data.teams} />
    </>
  );
}
