import { format, parseISO } from 'date-fns';
import { Clock, Users } from 'lucide-react';

import type { TodayEvent } from '../model/types';

interface WaitingStateProps {
  events: TodayEvent[];
}

export function WaitingState({ events }: WaitingStateProps) {
  return (
    <div className='flex flex-col gap-5'>
      <div className='rounded-lg border border-primary/20 bg-primary/5 p-5'>
        <h3 className='text-base font-semibold text-foreground'>
          You&apos;re all set
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          I&apos;ll join your meetings, take notes, and prepare a summary with
          action items. You don&apos;t need to do anything.
        </p>
      </div>

      <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        Upcoming today
      </div>

      <div className='flex flex-col gap-3'>
        {events.map((event) => {
          return (
            <div
              key={event.id}
              className='flex items-center gap-3 rounded-lg border border-border bg-card p-4'
            >
              <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                <Clock className='h-4 w-4' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium text-foreground truncate'>
                  {event.title}
                </p>
                <div className='flex items-center gap-2 mt-0.5 text-xs text-muted-foreground'>
                  <span>
                    {format(parseISO(event.starts_at), 'HH:mm')} —{' '}
                    {format(parseISO(event.ends_at), 'HH:mm')}
                  </span>
                  {event.participants_count > 0 && (
                    <span className='flex items-center gap-0.5'>
                      <Users className='h-3 w-3' />
                      {event.participants_count}
                    </span>
                  )}
                </div>
              </div>
              <span className='rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary'>
                Bot will join
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
