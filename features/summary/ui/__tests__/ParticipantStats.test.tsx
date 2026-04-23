import { render, screen } from '@testing-library/react';

import { ParticipantStats } from '@/features/summary/ui/ParticipantStats';

import type { ParticipantStats as ParticipantStatsType } from '@/features/summary/types';

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
    /**
     *
     */
    Cell: () => {
      return <div />;
    },
  };
});

const baseData: ParticipantStatsType = {
  total_unique: 42,
  average_per_meeting: 3.7,
  top: [
    { name: 'Alice', meetings_count: 15 },
    { name: 'Bob', meetings_count: 10 },
  ],
};

describe('ParticipantStats', () => {
  it('renders section heading', () => {
    render(<ParticipantStats data={baseData} />);
    expect(screen.getByText('Participants')).toBeInTheDocument();
  });

  it('renders unique count', () => {
    render(<ParticipantStats data={baseData} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Unique')).toBeInTheDocument();
  });

  it('renders average per meeting', () => {
    render(<ParticipantStats data={baseData} />);
    expect(screen.getByText('3.7')).toBeInTheDocument();
    expect(screen.getByText('Avg. per meeting')).toBeInTheDocument();
  });

  it('renders top participants card heading', () => {
    render(<ParticipantStats data={baseData} />);
    expect(screen.getByText('Top participants')).toBeInTheDocument();
  });

  it('shows empty state when top list is empty', () => {
    render(<ParticipantStats data={{ ...baseData, top: [] }} />);
    expect(screen.getByText('No participant data')).toBeInTheDocument();
  });
});
