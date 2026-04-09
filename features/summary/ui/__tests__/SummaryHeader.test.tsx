import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('lucide-react', () => {
  return {
    BarChart3: () => {
      return <span data-testid='bar-chart-icon' />;
    },
  };
});

import { SummaryHeader } from '@/features/summary/ui/SummaryHeader';

describe('SummaryHeader', () => {
  it('renders the page title', () => {
    render(<SummaryHeader />);
    expect(screen.getByText('Summary Report')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<SummaryHeader />);
    expect(
      screen.getByText('Analytics for meetings, tasks and participants'),
    ).toBeInTheDocument();
  });

  it('renders the chart icon', () => {
    render(<SummaryHeader />);
    expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
  });

  it('renders a date string', () => {
    render(<SummaryHeader />);
    // date-fns formats as "Month D, YYYY" — just check it looks like a date
    const date = screen.getByText(/\d{4}/);

    expect(date).toBeInTheDocument();
  });
});
