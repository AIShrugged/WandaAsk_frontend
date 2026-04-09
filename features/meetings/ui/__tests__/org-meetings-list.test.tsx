import { render, screen } from '@testing-library/react';
import React from 'react';

const mockPush = jest.fn();

jest.mock('next/navigation', () => {
  return {
    useRouter: () => {
      return { push: mockPush };
    },
  };
});

jest.mock('@/shared/hooks/use-infinite-scroll', () => {
  return {
    useInfiniteScroll: ({
      initialItems,
    }: {
      initialItems: unknown[];
      initialHasMore: boolean;
      fetchMore: unknown;
    }) => {
      return {
        items: initialItems,
        isLoading: false,
        hasMore: false,
        sentinelRef: { current: null },
      };
    },
  };
});

jest.mock('lucide-react', () => {
  return {
    CalendarSearch: () => {
      return <span data-testid='calendar-search-icon' />;
    },
    Bot: () => {
      return <span data-testid='bot-icon' />;
    },
    BotOff: () => {
      return <span data-testid='bot-off-icon' />;
    },
    CheckCircle2: () => {
      return <span data-testid='check-icon' />;
    },
    Video: () => {
      return <span data-testid='video-icon' />;
    },
    ExternalLink: () => {
      return <span data-testid='external-link-icon' />;
    },
    ArrowRight: () => {
      return <span data-testid='arrow-right-icon' />;
    },
  };
});

jest.mock('date-fns', () => {
  return {
    startOfDay: (d: Date) => {
      const out = new Date(d);
      out.setHours(0, 0, 0, 0);
      return out;
    },
  };
});

import { OrgMeetingsList } from '@/features/meetings/ui/org-meetings-list';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

const MEETING: CalendarEventListItem = {
  id: 1,
  title: 'Team Sync',
  starts_at: '2026-04-09T10:00:00.000Z',
  ends_at: '2026-04-09T11:00:00.000Z',
  platform: 'Zoom',
  url: null,
  description: 'Weekly sync',
  required_bot: true,
  has_summary: true,
};

describe('OrgMeetingsList', () => {
  const defaultProps = {
    initialItems: [],
    totalCount: 0,
    defaultDateFrom: '2026-04-06',
    defaultDateTo: '2026-04-12',
  };

  it('shows empty state when no items', () => {
    render(<OrgMeetingsList {...defaultProps} />);
    expect(
      screen.getByText('No bot meetings in this period'),
    ).toBeInTheDocument();
  });

  it('renders meeting cards when items are provided', () => {
    render(
      <OrgMeetingsList
        {...defaultProps}
        initialItems={[MEETING]}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Team Sync')).toBeInTheDocument();
  });

  it('renders date range inputs with default values', () => {
    render(<OrgMeetingsList {...defaultProps} />);
    const inputs = screen.getAllByDisplayValue(/2026-04/);
    expect(inputs).toHaveLength(2);
  });

  it('displays "Date range:" label', () => {
    render(<OrgMeetingsList {...defaultProps} />);
    expect(screen.getByText('Date range:')).toBeInTheDocument();
  });
});
