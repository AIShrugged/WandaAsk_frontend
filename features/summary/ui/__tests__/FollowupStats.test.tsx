import { render, screen } from '@testing-library/react';

import { FollowupStats } from '@/features/summary/ui/FollowupStats';

import type { FollowupStats as FollowupStatsType } from '@/features/summary/types';

const baseData: FollowupStatsType = {
  total: 15,
  by_status: { done: 8, in_progress: 5, failed: 2 },
};

describe('FollowupStats', () => {
  it('renders Follow-up heading', () => {
    render(<FollowupStats data={baseData} />);
    expect(screen.getByText('Follow-up')).toBeInTheDocument();
  });

  it('renders total count', () => {
    render(<FollowupStats data={baseData} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows empty state when all statuses are 0', () => {
    render(
      <FollowupStats
        data={{ total: 0, by_status: { done: 0, in_progress: 0, failed: 0 } }}
      />,
    );
    expect(screen.getByText('No follow-up data')).toBeInTheDocument();
  });
});
