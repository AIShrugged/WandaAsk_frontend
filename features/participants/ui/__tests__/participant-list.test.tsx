import { render, screen } from '@testing-library/react';

import { ParticipantList } from '@/shared/ui/participant/participant-list';

import type { AttendeeProps, GuestProps } from '@/entities/participant';

jest.mock('@/shared/ui/common/avatar', () => {
  return {
    __esModule: true,
    default: ({ children }: React.PropsWithChildren) => {
      return <div role='img'>{children}</div>;
    },
  };
});

const makeAttendee = (
  overrides: Partial<AttendeeProps> = {},
): AttendeeProps => {
  return {
    variant: 'attendee',
    calendar_event_id: 1,
    id: 1,
    name: 'Alice Smith',
    profile: null,
    ...overrides,
  };
};
const makeGuest = (overrides: Partial<GuestProps> = {}): GuestProps => {
  return {
    variant: 'guest',
    id: 1,
    channel: 'email',
    channel_identifier: 'guest@example.com',
    user_id: 0,
    ...overrides,
  };
};

describe('ParticipantList', () => {
  it('renders attendee names', () => {
    render(
      <ParticipantList
        data={[makeAttendee(), makeAttendee({ id: 2, name: 'Bob' })]}
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders guest channel_identifier when no name', () => {
    render(<ParticipantList data={[makeGuest()]} />);
    expect(screen.getByText('guest@example.com')).toBeInTheDocument();
  });

  it('shows first letter of attendee name in avatar', () => {
    render(<ParticipantList data={[makeAttendee()]} />);
    expect(screen.getByRole('img')).toHaveTextContent('A');
  });

  it('shows first letter of guest identifier in avatar', () => {
    render(<ParticipantList data={[makeGuest()]} />);
    expect(screen.getByRole('img')).toHaveTextContent('g');
  });

  it('renders empty list without error', () => {
    const { container } = render(<ParticipantList data={[]} />);

    expect(container.firstChild).toBeInTheDocument();
  });
});
