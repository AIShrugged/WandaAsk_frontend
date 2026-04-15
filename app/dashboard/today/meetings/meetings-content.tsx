'use client';

import { Suspense, useState } from 'react';

import {
  DayNavigator,
  DayTimeline,
  EmptyState,
  MeetingDetailCard,
  WaitingState,
} from '@/features/today-briefing';
import CardBody from '@/shared/ui/card/CardBody';
import { Skeleton } from '@/shared/ui/layout/skeleton';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { TodayBriefing } from '@/features/today-briefing';

interface MeetingsContentProps {
  data: TodayBriefing;
}

/**
 * Client component. Receives server-fetched briefing data as props.
 * Keyed on data.date by the parent so selectedId resets on every day change.
 */
export function MeetingsContent({ data }: MeetingsContentProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    data.events[0]?.id ?? null,
  );

  if (data.state === 'empty') {
    return <EmptyState />;
  }

  const selectedEvent =
    data.events.find((e) => {
      return e.id === selectedId;
    }) ?? null;

  return (
    <>
      <PageHeader
        title='Meetings'
        extraContent={
          <DayNavigator date={data.date} meetingsCount={data.events.length} />
        }
      />
      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          <Suspense
            fallback={
              <Skeleton className='h-48 rounded-[var(--radius-card)]' />
            }
          >
            <div className='flex flex-col gap-4'>
              <DayTimeline
                events={data.events}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              {data.events.length === 0 && <WaitingState events={[]} />}
              {selectedEvent && <MeetingDetailCard event={selectedEvent} />}
            </div>
          </Suspense>
        </CardBody>
      </div>
    </>
  );
}
