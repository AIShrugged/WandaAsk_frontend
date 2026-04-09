import { render, screen } from '@testing-library/react';
import React from 'react';

import Participants from '@/features/participants/ui/participants';
import ParticipantMatcher from '@/shared/ui/participant/participant-matcher';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

// Stub sub-components to keep tests focused on the composition
jest.mock('@/shared/ui/participant/participants-title', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <h3 data-testid='participants-title'>{children}</h3>;
    },
  };
});

jest.mock('@/shared/ui/participant/participant-list', () => {
  return {
    ParticipantList: ({ data }: { data: unknown[] }) => {
      return (
        <ul data-testid='participant-list'>
          {data.map((_, i) => {
            return <li key={i} data-testid='participant-item' />;
          })}
        </ul>
      );
    },
  };
});

jest.mock('@/shared/ui/participant/participant-matching', () => {
  return {
    __esModule: true,
    default: ({
      guests,
      attendees,
    }: {
      eventId: number;
      guests: GuestProps[];
      attendees: AttendeeProps[];
    }) => {
      return (
        <div
          data-testid='participant-matching'
          data-guests={guests.length}
          data-attendees={attendees.length}
        />
      );
    },
  };
});

const makeGuest = (id: number): GuestProps => {
  return {
    variant: 'guest',
    id,
    channel: 'email',
    channel_identifier: `guest${id}@example.com`,
    user_id: 0,
  };
};
const makeAttendee = (id: number): AttendeeProps => {
  return {
    variant: 'attendee',
    calendar_event_id: 1,
    id,
    name: `Attendee ${id}`,
    profile: null,
  };
};

describe('Participants', () => {
  it('renders the given title', () => {
    render(<Participants title='Guests' list={[]} />);
    expect(screen.getByTestId('participants-title')).toHaveTextContent(
      'Guests',
    );
  });

  it('passes list items to ParticipantList', () => {
    const guests = [makeGuest(1), makeGuest(2), makeGuest(3)];

    render(<Participants title='Guests' list={guests} />);
    expect(screen.getAllByTestId('participant-item')).toHaveLength(3);
  });

  it('renders with an empty list', () => {
    render(<Participants title='No one' list={[]} />);
    expect(screen.getByTestId('participant-list')).toBeInTheDocument();
    expect(screen.queryAllByTestId('participant-item')).toHaveLength(0);
  });
});

describe('ParticipantMatcher', () => {
  it('renders the "Match guests" title', () => {
    render(<ParticipantMatcher eventId={1} guests={[]} attendees={[]} />);
    expect(screen.getByTestId('participants-title')).toHaveTextContent(
      'Match guests',
    );
  });

  it('passes eventId, guests and attendees to ParticipantMatching', () => {
    const guests = [makeGuest(1), makeGuest(2)];
    const attendees = [makeAttendee(10)];

    render(
      <ParticipantMatcher eventId={42} guests={guests} attendees={attendees} />,
    );
    const matching = screen.getByTestId('participant-matching');

    expect(matching).toHaveAttribute('data-guests', '2');
    expect(matching).toHaveAttribute('data-attendees', '1');
  });
});
