'use client';

import { ArrowRight, Loader2 } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';

import { setProfile } from '@/features/participants/api/participants';
import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

/**
 * ParticipantMatching component.
 * @param root0
 * @param root0.eventId
 * @param root0.guests
 * @param root0.attendees
 */
export default function ParticipantMatching({
  eventId,
  guests,
  attendees,
}: {
  eventId: number;
  guests: GuestProps[];
  attendees: AttendeeProps[];
}) {
  const initialMatching: Record<number, string> = {};

  for (const attendee of attendees) {
    if (attendee.profile?.id) {
      initialMatching[attendee.id] = String(attendee.profile.id);
    }
  }

  const [optimisticMatching, updateOptimistic] = useOptimistic(
    initialMatching,
    (
      state,
      { attendeeId, guestId }: { attendeeId: number; guestId: string | null },
    ) => {
      return {
        ...state,
        [attendeeId]: guestId ?? '',
      };
    },
  );

  const [isPending, startTransition] = useTransition();

  const guestOptions = guests.map((guest) => {
    return {
      label: guest.channel_identifier,
      value: String(guest.id),
    };
  });

  /**
   * handleSelect.
   * @param attendeeId - attendeeId.
   * @param guestId - guestId.
   * @returns Result.
   */
  const handleSelect = (attendeeId: number, guestId: string) => {
    startTransition(() => {
      updateOptimistic({ attendeeId, guestId });

      setProfile(eventId, attendeeId, guestId).catch((error) => {
        console.error('Failed to save profile:', error);
      });
    });
  };

  return (
    <div className='flex flex-col gap-2'>
      {attendees.map((attendee) => {
        const currentValue = optimisticMatching[attendee.id] || '';

        return (
          <div key={attendee.id} className='flex items-center gap-3 relative'>
            <div className='text-muted-foreground'>
              <ArrowRight className='w-5 h-5' />
            </div>

            <div className='flex-1 relative'>
              <InputDropdown
                label=''
                options={guestOptions}
                value={currentValue}
                onChange={(value) => {
                  return handleSelect(attendee.id, value.toString());
                }}
                placeholder='Select invited'
                searchable
                disabled={isPending}
              />

              {isPending && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <Loader2 className='w-4 h-4 animate-spin text-primary' />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
