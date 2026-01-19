'use client';

import clsx from 'clsx';
import { Circle, CircleCheckBig } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react';

import { EventPopup } from '@/features/event/ui/event-popup';
import { useModal } from '@/shared/hooks/use-modal';
import { formatDate } from '@/shared/lib/dateFormatter';
import { isEventPast } from '@/shared/lib/isEventPast';
import { ROUTES } from '@/shared/lib/routes';

import type { EventProps } from '@/features/event/model/types';
import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

const Event = ({
  event,
  attendees,
  guests,
}: {
  event: EventProps;
  attendees: AttendeeProps[];
  guests: GuestProps[];
}) => {
  const { id, title } = event;

  const isPast = isEventPast(event.ends_at);

  const { push } = useRouter();
  const { open, close } = useModal();

  const anchorRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPast) {
      push(`${ROUTES.DASHBOARD.MEETING}/${id}?tab=summary`);
    } else {
      if (!anchorRef.current) {
        return;
      }

      if (open) {
        return open(
          <EventPopup
            attendees={attendees}
            guests={guests}
            event={event}
            close={close}
          />,
        );
      }
    }
  };

  return (
    <div
      ref={anchorRef}
      onClick={e => {
        handleClick(e);
        e.stopPropagation();
      }}
      className={clsx(
        'flex flex-row items-center gap-2 rounded-full p-[6px] mb-1 transition-colors cursor-pointer select-none',
        isPast ? 'bg-scheduled text-primary' : 'bg-primary text-white ',
      )}
    >
      <div className='flex flex-row items-center gap-2 flex-shrink-0'>
        {isPast ? (
          <CircleCheckBig className={'text-accent'} size={14} />
        ) : (
          <Circle size={14} />
        )}
        {isPast && (
          <p className='text-xs text-secondary line-through whitespace-nowrap'>
            {formatDate(event.starts_at)}
          </p>
        )}
      </div>
      <p className='text-xs font-bold truncate min-w-0'>{title}</p>
    </div>
  );
};

Event.displayName = 'CalendarEvent';

export default Event;
