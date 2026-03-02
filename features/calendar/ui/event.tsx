'use client';

import clsx from 'clsx';
import { Circle, CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { EventPopup } from '@/features/event/ui/event-popup';
import {
  getAttendees,
  getGuests,
} from '@/features/participants/api/participants';
import { useModal } from '@/shared/hooks/use-modal';
import { formatDate } from '@/shared/lib/dateFormatter';
import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import type { EventProps } from '@/entities/event';

const Event = ({ event }: { event: EventProps }) => {
  const isPast = isEventPast(event.ends_at);
  const { push } = useRouter();
  const { open, close } = useModal();
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPast) {
      push(`${ROUTES.DASHBOARD.MEETING}/${event.id}?tab=summary`);
      return;
    }

    if (!open) return;

    startTransition(async () => {
      try {
        const [{ data: attendees = [] }, { data: guests = [] }] =
          await Promise.all([
            getAttendees(String(event.id)),
            getGuests(String(event.id)),
          ]);
        open(
          <EventPopup
            attendees={attendees}
            guests={guests}
            event={event}
            close={close}
          />,
        );
      } catch {
        open(
          <EventPopup attendees={[]} guests={[]} event={event} close={close} />,
        );
      }
    });
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'flex flex-row items-center gap-2 rounded-full p-[6px] mb-1 transition-colors cursor-pointer select-none',
        isPast
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary text-primary-foreground',
        isPending && 'opacity-60',
      )}
    >
      <div className='flex flex-row items-center gap-2 flex-shrink-0'>
        {isPast ? (
          <CircleCheckBig className='text-primary' size={14} />
        ) : (
          <Circle size={14} />
        )}
        {isPast && (
          <p className='text-xs text-muted-foreground line-through whitespace-nowrap'>
            {formatDate(event.starts_at)}
          </p>
        )}
      </div>
      <p className='text-xs font-bold truncate min-w-0'>{event.title}</p>
    </div>
  );
};

Event.displayName = 'CalendarEvent';

export default Event;
