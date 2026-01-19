import { Minus, Plus } from 'lucide-react';
import React, { type JSX, useTransition } from 'react';

import { switchBot } from '@/app/actions/calendar-events';
import EventSummary from '@/features/event/ui/event-summary';
import { participants } from '@/features/participants/lib/options';
import { Button } from '@/shared/ui/button/Button';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';
import Participants from '@/widgets/event/ui/participants';

import type { EventProps } from '@/features/event/model/types';
import type {
  AttendeeProps,
  GuestProps,
} from '@/features/participants/model/types';

export function EventPopup({
  event,
  close,
  guests,
  attendees,
}: {
  event: EventProps;
  close: () => void;
  attendees: AttendeeProps[];
  guests: GuestProps[];
}): JSX.Element {
  const [isPending, startTransition] = useTransition();

  const isBotAdded = event.required_bot;
  const Icon = isBotAdded ? Minus : Plus;
  const actionText = isBotAdded ? 'remove bot' : 'add bot';

  const handleSwitchBot = () => {
    startTransition(async () => {
      try {
        await switchBot(event.id, !event.required_bot).then(() => close());
      } catch (error) {
        console.warn('name', {
          message: (error as Error).message,
        });
      }
    });
  };

  return (
    <>
      <ModalHeader onClick={close} title={event.title} />
      <ModalBody>
        <div className='flex flex-col gap-7'>
          <EventSummary event={event} />
        </div>

        <div className={'flex flex-row justify-between mt-7'}>
          <Participants list={guests} title={participants.guest} />
          <Participants list={attendees} title={participants.attendee} />
        </div>
      </ModalBody>

      <ModalFooter>
        <div className={'ml-auto w-[250px]'}>
          <Button
            onClick={handleSwitchBot}
            disabled={isPending}
            loading={isPending}
            aria-label={isBotAdded ? 'remove bot' : 'add bot'}
          >
            <div className='flex items-center gap-3'>
              <Icon size={24} aria-hidden='true' />
              <span>{actionText}</span>
            </div>
          </Button>
        </div>
      </ModalFooter>
    </>
  );
}
