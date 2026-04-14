import { render, screen } from '@testing-library/react';

import { EventPopup } from '@/features/event/ui/event-popup';

import type { EventProps } from '@/entities/event';

jest.mock('@/features/event/api/calendar-events', () => {
  return {
    switchBot: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
});

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { refresh: jest.fn() };
    },
  };
});

jest.mock('@/features/event/ui/event-summary', () => {
  return {
    __esModule: true,
    default: ({ event }: { event: EventProps }) => {
      return <div data-testid='event-summary'>{event.title}</div>;
    },
  };
});

jest.mock('@/features/participants/ui/participants', () => {
  return {
    __esModule: true,
    default: ({ title }: { title: string }) => {
      return <div data-testid='participants'>{title}</div>;
    },
  };
});

jest.mock('@/shared/ui/modal/modal-header', () => {
  return {
    __esModule: true,
    default: ({ title, onClick }: { title: string; onClick: () => void }) => {
      return (
        <div data-testid='modal-header' onClick={onClick}>
          {title}
        </div>
      );
    },
  };
});

jest.mock('@/shared/ui/modal/modal-body', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
  };
});

jest.mock('@/shared/ui/modal/modal-footer', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
  };
});

const makeEvent = (overrides: Partial<EventProps> = {}): EventProps => {
  return {
    id: 1,
    title: 'Sprint Planning',
    description: '',
    starts_at: '2024-03-15 10:00:00',
    ends_at: '2024-03-15 11:00:00',
    url: 'https://meet.example.com',
    platform: 'zoom',
    required_bot: false,
    creator_user_id: 1,
    has_summary: false,
    ...overrides,
  };
};

describe('EventPopup', () => {
  it('renders event title in header', () => {
    render(
      <EventPopup
        event={makeEvent()}
        close={jest.fn()}
        guests={[]}
        attendees={[]}
      />,
    );
    expect(screen.getByTestId('modal-header')).toHaveTextContent(
      'Sprint Planning',
    );
  });

  it('renders EventSummary', () => {
    render(
      <EventPopup
        event={makeEvent()}
        close={jest.fn()}
        guests={[]}
        attendees={[]}
      />,
    );
    expect(screen.getByTestId('event-summary')).toBeInTheDocument();
  });

  it('shows "Add Bot" button when bot not added', () => {
    render(
      <EventPopup
        event={makeEvent({ required_bot: false })}
        close={jest.fn()}
        guests={[]}
        attendees={[]}
      />,
    );
    expect(
      screen.getByRole('button', { name: /add bot/i }),
    ).toBeInTheDocument();
  });

  it('shows "Remove Bot" button when bot is added', () => {
    render(
      <EventPopup
        event={makeEvent({ required_bot: true })}
        close={jest.fn()}
        guests={[]}
        attendees={[]}
      />,
    );
    expect(
      screen.getByRole('button', { name: /remove bot/i }),
    ).toBeInTheDocument();
  });
});
