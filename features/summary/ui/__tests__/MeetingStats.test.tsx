import { render, screen } from '@testing-library/react';

import { MeetingStats } from '@/features/summary/ui/MeetingStats';

import type { MeetingStats as MeetingStatsType } from '@/features/summary/types';

jest.mock('recharts', () => {
  return {
    /**
     *
     * @param root0
     * @param root0.children
     */
    ResponsiveContainer: ({ children }: React.PropsWithChildren) => {
      return <div>{children}</div>;
    },
    /**
     *
     * @param root0
     * @param root0.children
     */
    BarChart: ({ children }: React.PropsWithChildren) => {
      return <div>{children}</div>;
    },
    /**
     *
     */
    Bar: () => {
      return <div />;
    },
    /**
     *
     */
    XAxis: () => {
      return <div />;
    },
    /**
     *
     */
    YAxis: () => {
      return <div />;
    },
    /**
     *
     */
    CartesianGrid: () => {
      return <div />;
    },
    /**
     *
     */
    Tooltip: () => {
      return <div />;
    },
  };
});

const baseData: MeetingStatsType = {
  total: 50,
  with_bot: 12,
  total_duration_minutes: 3000,
  average_duration_minutes: 60,
  recent: [
    {
      id: 1,
      title: 'Sprint Planning',
      starts_at: '2026-02-10T10:00:00Z',
      ends_at: '2026-02-10T11:00:00Z',
      duration_minutes: 60,
      participants_count: 5,
    },
  ],
  by_month: [{ month: '2026-02', count: 10, total_duration_minutes: 600 }],
};

describe('MeetingStats', () => {
  it('renders section heading', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Meetings')).toBeInTheDocument();
  });

  it('renders with_bot sub-stat', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('With bot')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders avg duration sub-stat in minutes', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Avg. duration')).toBeInTheDocument();
    expect(screen.getAllByText('60 min').length).toBeGreaterThanOrEqual(1);
  });

  it('renders total time in hours', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Total time')).toBeInTheDocument();
    expect(screen.getByText('50 h')).toBeInTheDocument();
  });

  it('renders Meetings by month card when by_month is non-empty', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Meetings by month')).toBeInTheDocument();
  });

  it('does not render monthly chart when by_month is empty', () => {
    render(<MeetingStats data={{ ...baseData, by_month: [] }} />);
    expect(screen.queryByText('Meetings by month')).not.toBeInTheDocument();
  });

  it('renders recent meetings table with correct columns', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Recent meetings')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Participants')).toBeInTheDocument();
  });

  it('renders meeting title in recent table', () => {
    render(<MeetingStats data={baseData} />);
    expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
  });

  it('shows empty state when recent list is empty', () => {
    render(<MeetingStats data={{ ...baseData, recent: [] }} />);
    expect(screen.getByText('No meeting data')).toBeInTheDocument();
  });
});
