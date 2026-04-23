import { render, screen } from '@testing-library/react';

import { TaskStats } from '@/features/summary/ui/TaskStats';

import type { TaskStats as TaskStatsType } from '@/features/summary/types';

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
    PieChart: ({ children }: React.PropsWithChildren) => {
      return <div>{children}</div>;
    },
    /**
     *
     */
    Pie: () => {
      return <div />;
    },
    /**
     *
     */
    Cell: () => {
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
    Legend: () => {
      return <div />;
    },
  };
});

const baseData: TaskStatsType = {
  total: 20,
  overdue: 0,
  by_status: { open: 5, in_progress: 8, done: 6, cancelled: 1 },
};

describe('TaskStats', () => {
  it('renders section heading', () => {
    render(<TaskStats data={baseData} />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders total tasks count', () => {
    render(<TaskStats data={baseData} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('does not render overdue badge when overdue is 0', () => {
    render(<TaskStats data={baseData} />);
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('renders overdue badge when overdue > 0', () => {
    render(<TaskStats data={{ ...baseData, overdue: 3 }} />);
    expect(screen.getByText('Overdue tasks: 3')).toBeInTheDocument();
  });

  it('renders empty state when all statuses are zero', () => {
    render(
      <TaskStats
        data={{
          total: 0,
          overdue: 0,
          by_status: { open: 0, in_progress: 0, done: 0, cancelled: 0 },
        }}
      />,
    );
    expect(screen.getByText('No task data')).toBeInTheDocument();
  });
});
