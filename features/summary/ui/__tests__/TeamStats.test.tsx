import { render, screen } from '@testing-library/react';

import { TeamStats } from '@/features/summary/ui/TeamStats';

import type { TeamStats as TeamStatsType } from '@/features/summary/types';

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

const baseData: TeamStatsType = {
  total: 3,
  list: [
    { id: 1, name: 'Engineering', members_count: 10 },
    { id: 2, name: 'Design', members_count: 5 },
  ],
};

describe('TeamStats', () => {
  it('renders section heading', () => {
    render(<TeamStats data={baseData} />);
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders total teams count', () => {
    render(<TeamStats data={baseData} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total teams')).toBeInTheDocument();
  });

  it('renders team sizes card when list is non-empty', () => {
    render(<TeamStats data={baseData} />);
    expect(screen.getByText('Team sizes')).toBeInTheDocument();
  });

  it('does not render team sizes card when list is empty', () => {
    render(<TeamStats data={{ total: 0, list: [] }} />);
    expect(screen.queryByText('Team sizes')).not.toBeInTheDocument();
  });

  it('still renders total count when list is empty', () => {
    render(<TeamStats data={{ total: 0, list: [] }} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
