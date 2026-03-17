import { Minus, Plus } from 'lucide-react';
import React, { type JSX, useTransition } from 'react';

import { switchBot } from '@/features/event/api/calendar-events';
import EventSummary from '@/features/event/ui/event-summary';
import {
  participantLabels as participants,
  Participants,
} from '@/features/participants';
import { Button } from '@/shared/ui/button/Button';
import ModalBody from '@/shared/ui/modal/modal-body';
import ModalFooter from '@/shared/ui/modal/modal-footer';
import ModalHeader from '@/shared/ui/modal/modal-header';

import type { EventProps } from '@/entities/event';
import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * EventPopup component.
 * @param root0 - Component props.
 * @param root0.event - The event to display.
 * @param root0.close - Callback to close the popup.
 * @param root0.attendees - List of attendees.
 * @param root0.guests - List of guests.
 * @returns JSX element.
 */
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

  /**
   * handleSwitchBot.
   */
  const handleSwitchBot = () => {
    startTransition(async () => {
      try {
        await switchBot(event.id, !event.required_bot).then(() => {
          return close();
        });
      } catch (error) {
        // eslint-disable-next-line no-console
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
        <div className={'w-full md:w-[250px] md:ml-auto'}>
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
