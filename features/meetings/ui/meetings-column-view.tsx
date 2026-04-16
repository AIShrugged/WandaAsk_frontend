'use client';

import { CalendarOff } from 'lucide-react';

import { DateSwitcher } from './date-switcher';
import { MeetingCard } from './meeting-card';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

interface ColumnData {
  date: string;
  meetings: CalendarEventListItem[];
}

function MeetingsColumn({ column }: { column: ColumnData }) {
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-3'>
      {/* Column header — date only */}
      <div className='border-b border-border pb-3'>
        <span className='text-sm font-semibold text-foreground'>
          {column.date}
        </span>
      </div>

      {/* Meeting cards */}
      {column.meetings.length > 0 ? (
        <div className='flex flex-col gap-3'>
          {column.meetings.map((meeting) => {
            return <MeetingCard key={meeting.id} meeting={meeting} />;
          })}
        </div>
      ) : (
        <div className='flex flex-col items-center gap-2 py-8 text-center'>
          <CalendarOff
            className='h-7 w-7 text-muted-foreground/40'
            aria-hidden='true'
          />
          <p className='text-xs text-muted-foreground'>No meetings</p>
        </div>
      )}
    </div>
  );
}

interface MeetingsColumnViewProps {
  yesterday: CalendarEventListItem[];
  today: CalendarEventListItem[];
  tomorrow: CalendarEventListItem[];
  yesterdayDate: string;
  todayDate: string;
  tomorrowDate: string;
  /** YYYY-MM-DD of the center (today) column — used by DateSwitcher */
  centerDate: string;
}

/**
 * MeetingsColumnView — three-column layout (yesterday / today / tomorrow)
 * with date headers and prev/next day navigation.
 */
export function MeetingsColumnView({
  yesterday,
  today,
  tomorrow,
  yesterdayDate,
  todayDate,
  tomorrowDate,
  centerDate,
}: MeetingsColumnViewProps) {
  const columns: ColumnData[] = [
    { date: yesterdayDate, meetings: yesterday },
    { date: todayDate, meetings: today },
    { date: tomorrowDate, meetings: tomorrow },
  ];

  return (
    <div className='px-6 py-6'>
      <div className='mb-5'>
        <DateSwitcher selectedDate={centerDate} />
      </div>

      {/* Desktop: 3 equal columns */}
      <div className='hidden gap-6 md:grid md:grid-cols-3'>
        {columns.map((col) => {
          return <MeetingsColumn key={col.date} column={col} />;
        })}
      </div>

      {/* Mobile: stacked sections */}
      <div className='flex flex-col gap-8 md:hidden'>
        {columns.map((col) => {
          return <MeetingsColumn key={col.date} column={col} />;
        })}
      </div>
    </div>
  );
}
