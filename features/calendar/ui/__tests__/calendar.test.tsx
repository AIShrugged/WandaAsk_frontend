import { render, screen } from '@testing-library/react';

import Calendar from '@/features/calendar/ui/calendar';

import type { EventProps } from '@/entities/event';

jest.mock('@/features/calendar/ui/calendar-agenda', () => {
  return {
    __esModule: true,
    default: ({
      events,
      currentMonth,
    }: {
      events: EventProps[];
      currentMonth: string;
    }) => {
      return (
        <div data-testid='calendar-agenda'>
          agenda:{events.length}:{currentMonth}
        </div>
      );
    },
  };
});

jest.mock('@/features/calendar/ui/cells', () => {
  return {
    __esModule: true,
    default: ({
      events,
      currentMonth,
    }: {
      events: EventProps[];
      currentMonth: string;
    }) => {
      return (
        <div data-testid='cells'>
          cells:{events.length}:{currentMonth}
        </div>
      );
    },
  };
});

jest.mock('@/features/calendar/ui/day-of-week', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='day-of-week' />;
    },
  };
});

jest.mock('@/features/calendar/ui/month-switcher', () => {
  return {
    MonthSwitcher: ({ currentMonth }: { currentMonth: string }) => {
      return <div data-testid='month-switcher'>{currentMonth}</div>;
    },
  };
});

jest.mock('@/shared/ui/layout/component-header', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <header>{children}</header>;
    },
  };
});

const CURRENT_MONTH = '2026-03-01';

describe('Calendar', () => {
  it('renders MonthSwitcher with currentMonth', () => {
    render(<Calendar events={[]} currentMonth={CURRENT_MONTH} />);

    expect(screen.getByTestId('month-switcher')).toHaveTextContent(
      CURRENT_MONTH,
    );
  });

  it('renders CalendarAgenda for mobile view', () => {
    render(<Calendar events={[]} currentMonth={CURRENT_MONTH} />);

    expect(screen.getByTestId('calendar-agenda')).toBeInTheDocument();
  });

  it('renders Cells with events and currentMonth', () => {
    render(<Calendar events={[]} currentMonth={CURRENT_MONTH} />);

    expect(screen.getByTestId('cells')).toHaveTextContent(
      `cells:0:${CURRENT_MONTH}`,
    );
  });

  it('renders DayOfWeek header', () => {
    render(<Calendar events={[]} currentMonth={CURRENT_MONTH} />);

    expect(screen.getByTestId('day-of-week')).toBeInTheDocument();
  });

  it('passes event count to CalendarAgenda', () => {
    const events = [
      {
        id: 1,
        title: 'E1',
        description: '',
        starts_at: '2026-03-05T10:00:00Z',
        ends_at: '2026-03-05T11:00:00Z',
        platform: 'zoom',
        url: '',
        external_id: '1',
        required_bot: false,
        source_id: 1,
      },
    ] as EventProps[];

    render(<Calendar events={events} currentMonth={CURRENT_MONTH} />);

    expect(screen.getByTestId('calendar-agenda')).toHaveTextContent('agenda:1');
  });
});
