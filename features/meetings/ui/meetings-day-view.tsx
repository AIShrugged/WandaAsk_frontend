'use client';

import { CalendarOff } from 'lucide-react';

import { DateSwitcher } from './date-switcher';
import { MeetingCard } from './meeting-card';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

interface MeetingsDayViewProps {
  meetings: CalendarEventListItem[];
  selectedDate: string; // YYYY-MM-DD
}

export function MeetingsDayView({
  meetings,
  selectedDate,
}: MeetingsDayViewProps) {
  return (
    <div className='px-6 py-6'>
      <DateSwitcher selectedDate={selectedDate} />

      <div className='mt-4'>
        {meetings.length > 0 ? (
          <div className='flex flex-col gap-3'>
            {meetings.map((meeting) => {
              return <MeetingCard key={meeting.id} meeting={meeting} />;
            })}
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2 py-8 text-center'>
            <CalendarOff
              className='h-7 w-7 text-muted-foreground/40'
              aria-hidden='true'
            />
            <p className='text-xs text-muted-foreground'>
              No meetings for this day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
