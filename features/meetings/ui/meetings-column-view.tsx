'use client';

import { CalendarOff } from 'lucide-react';

import { MeetingCard } from './meeting-card';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

interface ColumnData {
  label: string;
  date: string;
  meetings: CalendarEventListItem[];
}

function MeetingsColumn({ column }: { column: ColumnData }) {
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-3'>
      {/* Column header */}
      <div className='flex flex-col gap-0.5 border-b border-border pb-3'>
        <span className='text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          {column.label}
        </span>
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
          <CalendarOff className='h-7 w-7 text-muted-foreground/40' />
          <p className='text-xs text-muted-foreground'>No bot meetings</p>
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
}

/**
 * MeetingsColumnView — three-column layout showing bot meetings for
 * yesterday, today, and tomorrow.
 */
export function MeetingsColumnView({
  yesterday,
  today,
  tomorrow,
  yesterdayDate,
  todayDate,
  tomorrowDate,
}: MeetingsColumnViewProps) {
  const columns: ColumnData[] = [
    { label: 'Yesterday', date: yesterdayDate, meetings: yesterday },
    { label: 'Today', date: todayDate, meetings: today },
    { label: 'Tomorrow', date: tomorrowDate, meetings: tomorrow },
  ];

  return (
    <div className='px-6 py-6'>
      {/* Desktop: 3 equal columns */}
      <div className='hidden gap-6 md:grid md:grid-cols-3'>
        {columns.map((col) => {
          return <MeetingsColumn key={col.label} column={col} />;
        })}
      </div>

      {/* Mobile: stacked sections */}
      <div className='flex flex-col gap-8 md:hidden'>
        {columns.map((col) => {
          return <MeetingsColumn key={col.label} column={col} />;
        })}
      </div>
    </div>
  );
}
