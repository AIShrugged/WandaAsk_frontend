import { Suspense } from 'react';

import {
  getMainDashboardData,
  MeetingsBlock,
  UpcomingAgendasBlock,
  IssuesBlock,
  AgentTasksBlock,
} from '@/features/main-dashboard';
import {
  getAttendees,
  getGuests,
} from '@/features/participants/api/participants';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

export const metadata = { title: 'Overview' };

/**
 * Main dashboard overview tab page.
 */
export default async function MainOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting_id?: string }>;
}) {
  const {
    todayEvents,
    tomorrowEvents,
    pastEvents,
    agentTasks,
    canManageAgents,
    agendas,
    issues,
  } = await getMainDashboardData();

  const { meeting_id } = await searchParams;

  const initialSelectedId =
    meeting_id && !Number.isNaN(Number(meeting_id)) ? Number(meeting_id) : null;

  let initialAttendees: AttendeeProps[] = [];
  let initialGuests: GuestProps[] = [];

  if (meeting_id && !Number.isNaN(Number(meeting_id))) {
    const [attendeesResult, guestsResult] = await Promise.allSettled([
      getAttendees(meeting_id),
      getGuests(meeting_id),
    ]);
    if (attendeesResult.status === 'fulfilled') {
      initialAttendees = attendeesResult.value.data ?? [];
    }
    if (guestsResult.status === 'fulfilled') {
      initialGuests = guestsResult.value.data ?? [];
    }
  }

  return (
    <div className='flex flex-col gap-5 p-2'>
      <Suspense
        fallback={<Skeleton className='h-48 rounded-[var(--radius-card)]' />}
      >
        <MeetingsBlock
          todayEvents={todayEvents}
          tomorrowEvents={tomorrowEvents}
          pastEvents={pastEvents}
          initialSelectedId={initialSelectedId}
          initialAttendees={initialAttendees}
          initialGuests={initialGuests}
        />
      </Suspense>

      <UpcomingAgendasBlock agendas={agendas} />

      <IssuesBlock issues={issues} />

      <AgentTasksBlock tasks={agentTasks} canManageAgents={canManageAgents} />
    </div>
  );
}
