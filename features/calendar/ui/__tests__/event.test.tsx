/* eslint-disable jsdoc/require-jsdoc */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockPush = jest.fn();

const mockOpen = jest.fn();

const mockClose = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('@/shared/hooks/use-modal', () => {
  return {
    useModal: () => {
      return { open: mockOpen, close: mockClose };
    },
  };
});

jest.mock('@/features/participants/api/participants', () => {
  return {
    getAttendees: jest.fn().mockResolvedValue({ data: [] }),
    getGuests: jest.fn().mockResolvedValue({ data: [] }),
  };
});

jest.mock('@/features/event/ui/event-popup', () => {
  return {
    EventPopup: () => {
      return <div data-testid='event-popup' />;
    },
  };
});

jest.mock('@/shared/lib/isEventPast', () => {
  return {
    isEventPast: jest.fn(),
  };
});

jest.mock('@/shared/lib/dateFormatter', () => {
  return {
    formatDate: (d: string) => {
      return d;
    },
  };
});

jest.mock('lucide-react', () => {
  return {
    Circle: () => {
      return <span data-testid='circle-icon' />;
    },
    CircleCheckBig: () => {
      return <span data-testid='check-icon' />;
    },
  };
});

jest.mock('clsx', () => {
  return {
    __esModule: true,
    default: (...args: unknown[]) => {
      return args.filter(Boolean).join(' ');
    },
  };
});

import Event from '@/features/calendar/ui/event';
import { isEventPast } from '@/shared/lib/isEventPast';

import type { EventProps } from '@/entities/event';

const EVENT_TITLE = 'Team Meeting';

const makeEvent = (id: number = 1): EventProps => {
  return {
    id,
    title: EVENT_TITLE,
    starts_at: '2024-03-15T10:00:00Z',
    ends_at: '2024-03-15T11:00:00Z',
    color: '#ff0000',
  };
};

const user = userEvent.setup({ delay: null });

describe('Event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isEventPast as jest.Mock).mockReturnValue(false);
  });

  it('renders the event title', () => {
    render(<Event event={makeEvent()} />);
    expect(screen.getByText(EVENT_TITLE)).toBeInTheDocument();
  });

  it('shows a circle icon for future events', () => {
    (isEventPast as jest.Mock).mockReturnValue(false);
    render(<Event event={makeEvent()} />);
    expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
  });

  it('shows a checkmark icon for past events', () => {
    (isEventPast as jest.Mock).mockReturnValue(true);
    render(<Event event={makeEvent()} />);
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('navigates to meeting summary page when past event is clicked', async () => {
    (isEventPast as jest.Mock).mockReturnValue(true);
    render(<Event event={makeEvent(1)} />);
    await user.click(screen.getByText(EVENT_TITLE));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/1'));
  });

  it('opens a popup when a future event is clicked', async () => {
    (isEventPast as jest.Mock).mockReturnValue(false);
    render(<Event event={makeEvent()} />);
    await act(async () => {
      await user.click(screen.getByText(EVENT_TITLE));
    });
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalled();
    });
  });
});
