'use client';

import { format, isToday, parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import type { TodayEvent } from '../model/types';

interface DayTimelineProps {
  events: TodayEvent[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const MIN_HOUR = 9;
const MAX_HOUR = 18;

function getHourRange(events: TodayEvent[]): [number, number] {
  let min = MIN_HOUR;
  let max = MAX_HOUR;

  for (const e of events) {
    const startH = parseISO(e.starts_at).getHours();
    const endH = parseISO(e.ends_at).getHours() + 1;
    if (startH < min) min = startH;
    if (endH > max) max = endH;
  }

  return [min, max];
}

const STATE_COLORS: Record<string, string> = {
  ready: 'bg-emerald-500/80 hover:bg-emerald-500/90 border-emerald-500/30',
  waiting: 'bg-amber-500/60 hover:bg-amber-500/70 border-amber-500/30',
  scheduled:
    'bg-muted-foreground/30 hover:bg-muted-foreground/40 border-muted-foreground/20',
};

export function DayTimeline({
  events,
  selectedId,
  onSelect,
}: DayTimelineProps) {
  const [minHour, maxHour] = useMemo(() => {
    return getHourRange(events);
  }, [events]);
  const totalHours = maxHour - minHour;

  // "Now" line — updates every minute, only shown for today
  const [nowPercent, setNowPercent] = useState<number | null>(null);

  useEffect(() => {
    function calcNow() {
      const firstEvent = events[0];
      if (!firstEvent) return null;
      const eventDate = parseISO(firstEvent.starts_at);
      if (!isToday(eventDate)) return null;

      const now = new Date();
      const nowMins = (now.getHours() - minHour) * 60 + now.getMinutes();
      const totalMins = totalHours * 60;
      const pct = (nowMins / totalMins) * 100;
      if (pct < 0 || pct > 100) return null;
      return pct;
    }

    setNowPercent(calcNow());
    const interval = setInterval(() => {
      return setNowPercent(calcNow());
    }, 60_000);
    return () => {
      return clearInterval(interval);
    };
  }, [events, minHour, totalHours]);

  const hours = useMemo(() => {
    const arr: string[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      arr.push(h <= 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);
    }
    return arr;
  }, [minHour, maxHour]);

  function getPosition(event: TodayEvent) {
    const start = parseISO(event.starts_at);
    const end = parseISO(event.ends_at);
    const startMins = (start.getHours() - minHour) * 60 + start.getMinutes();
    const endMins = (end.getHours() - minHour) * 60 + end.getMinutes();
    const totalMins = totalHours * 60;

    return {
      left: `${(startMins / totalMins) * 100}%`,
      width: `${Math.max(((endMins - startMins) / totalMins) * 100, 3)}%`,
    };
  }

  return (
    <div className='rounded-lg border border-border bg-card p-4'>
      {/* Hour labels */}
      <div className='flex justify-between mb-2 px-1'>
        {hours.map((label) => {
          return (
            <span key={label} className='text-[10px] text-muted-foreground'>
              {label}
            </span>
          );
        })}
      </div>

      {/* Track */}
      <div className='relative h-10 rounded-md bg-muted/30'>
        {events.map((event) => {
          const pos = getPosition(event);
          const isSelected = selectedId === event.id;
          const colorClass =
            STATE_COLORS[event.meeting_state] ?? STATE_COLORS.scheduled;

          return (
            <button
              key={event.id}
              type='button'
              onClick={() => {
                return onSelect(event.id);
              }}
              className={`absolute top-1 bottom-1 rounded-md border text-[11px] font-medium text-white px-2 flex items-center gap-1.5 truncate transition-all cursor-pointer ${colorClass} ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''}`}
              style={{ left: pos.left, width: pos.width }}
              title={`${event.title} — ${format(parseISO(event.starts_at), 'HH:mm')}–${format(parseISO(event.ends_at), 'HH:mm')}`}
            >
              {event.tasks.length > 0 && (
                <span className='flex h-4 min-w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold'>
                  {event.tasks.length}
                </span>
              )}
              <span className='truncate'>{event.title}</span>
            </button>
          );
        })}

        {/* Now indicator — red line showing current time */}
        {nowPercent !== null && (
          <div
            className='absolute top-0 bottom-0 w-0.5 bg-red-500 z-10'
            style={{ left: `${nowPercent}%` }}
          >
            <div className='absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-red-500' />
          </div>
        )}
      </div>
    </div>
  );
}
