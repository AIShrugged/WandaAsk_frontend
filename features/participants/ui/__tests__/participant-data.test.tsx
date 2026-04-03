import { render, screen } from '@testing-library/react';

import ParticipantData from '@/shared/ui/participant/participant-data';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

jest.mock('@/features/participants/ui/participants', () => {
  return {
    __esModule: true,
    default: ({ list, title }: { list: unknown[]; title: string }) => {
      return (
        <div data-testid={`participants-${title}`}>
          {title}:{list.length}
        </div>
      );
    },
  };
});

jest.mock('@/shared/ui/participant/participant-matcher', () => {
  return {
    __esModule: true,
    default: ({ eventId }: { eventId: number }) => {
      return <div data-testid='matcher'>matcher:{eventId}</div>;
    },
  };
});

const makeGuest = (id: number): GuestProps => {
  return {
    id,
    name: `Guest ${id}`,
    email: `guest${id}@test.com`,
  } as GuestProps;
};
const makeAttendee = (id: number): AttendeeProps => {
  return {
    id,
    name: `Attendee ${id}`,
    email: `attendee${id}@test.com`,
  } as AttendeeProps;
};

describe('ParticipantData', () => {
  it('renders Participants for guests', async () => {
    const guests = [makeGuest(1), makeGuest(2)];

    render(
      await ParticipantData({
        eventId: 10,
        guests,
        attendees: [],
      }),
    );

    expect(screen.getByTestId('participants-Invited guests')).toHaveTextContent(
      '2',
    );
  });

  it('renders Participants for attendees', async () => {
    const attendees = [makeAttendee(1)];

    render(
      await ParticipantData({
        eventId: 10,
        guests: [],
        attendees,
      }),
    );

    expect(
      screen.getByTestId('participants-Actual attendees'),
    ).toHaveTextContent('1');
  });

  it('renders ParticipantMatcher by default', async () => {
    render(
      await ParticipantData({
        eventId: 42,
        guests: [],
        attendees: [],
      }),
    );

    expect(screen.getByTestId('matcher')).toHaveTextContent('matcher:42');
  });

  it('hides ParticipantMatcher when withoutMatcher=true', async () => {
    render(
      await ParticipantData({
        eventId: 42,
        guests: [],
        attendees: [],
        withoutMatcher: true,
      }),
    );

    expect(screen.queryByTestId('matcher')).not.toBeInTheDocument();
  });
});
