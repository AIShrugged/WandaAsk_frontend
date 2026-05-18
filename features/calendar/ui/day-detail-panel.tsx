'use client';

import { format, parseISO } from 'date-fns';
import { CalendarOff, X } from 'lucide-react';
import { useMemo } from 'react';

import type { EventProps } from '@/entities/event';
import type { ReactNode } from 'react';

interface DayDetailPanelProps {
  selectedDay: string;
  events: EventProps[];
  renderEvent: (event: EventProps) => ReactNode;
  onClose: () => void;
}

export function DayDetailPanel({
  selectedDay,
  events,
  renderEvent,
  onClose,
}: DayDetailPanelProps) {
  const dayEvents = useMemo(() => {
    return events.filter((e) => {
      return e.starts_at.slice(0, 10) === selectedDay;
    });
  }, [events, selectedDay]);

  const day = parseISO(selectedDay);

  return (
    <div
      className='w-72 shrink-0 border-l border-border bg-card flex flex-col animate-in slide-in-from-right-4 duration-200'
      role='complementary'
      aria-label={`Events for ${format(day, 'MMMM d')}`}
    >
      <div className='flex items-center justify-between px-4 py-2 border-b border-border'>
        <span className='text-sm font-semibold'>
          {format(day, 'EEEE, MMMM d')}
        </span>
        <button
          type='button'
          aria-label='Close day panel'
          onClick={onClose}
          className='flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-3 space-y-2'>
        {dayEvents.length > 0 ? (
          dayEvents.map((ev) => {
            return <div key={ev.id}>{renderEvent(ev)}</div>;
          })
        ) : (
          <div className='flex flex-col items-center justify-center py-6'>
            <CalendarOff
              className='h-8 w-8 text-muted-foreground/30 mb-2'
              aria-hidden='true'
            />
            <p className='text-xs text-muted-foreground text-center'>
              No events for this day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
