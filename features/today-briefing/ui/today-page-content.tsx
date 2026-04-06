'use client';

import { useState } from 'react';

import { AiNudge } from './ai-nudge';
import { DayNavigator } from './day-navigator';
import { DayTimeline } from './day-timeline';
import { EmptyState } from './empty-state';
import { MeetingDetailCard } from './meeting-detail-card';
import { StaleItems } from './stale-items';
import { WaitingOnYou } from './waiting-on-you';
import { WaitingState } from './waiting-state';

import type { TodayBriefing } from '../model/types';

interface TodayPageContentProps {
  data: TodayBriefing;
}

export function TodayPageContent({ data }: TodayPageContentProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    data.events[0]?.id ?? null,
  );

  if (data.state === 'empty') {
    return <EmptyState />;
  }

  if (data.state === 'waiting') {
    return (
      <div className='flex flex-col gap-5 p-4'>
        <DayNavigator date={data.date} />
        <WaitingState events={data.events} />
      </div>
    );
  }

  const selectedEvent = data.events.find((e) => e.id === selectedId) ?? null;

  return (
    <div className='flex flex-col gap-5 p-4'>
      <DayNavigator date={data.date} />

      {data.events.length > 0 && (
        <DayTimeline
          events={data.events}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <AiNudge text={data.nudge} />

      {selectedEvent && (
        <MeetingDetailCard
          event={selectedEvent}
          carriedTasks={data.carried_tasks}
        />
      )}

      <WaitingOnYou tasks={data.waiting_on_you} />

      <StaleItems tasks={data.stale} />
    </div>
  );
}
