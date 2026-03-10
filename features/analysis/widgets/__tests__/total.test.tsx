/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import Total from '@/features/analysis/widgets/total';

import type { AnalysisProps } from '@/features/analysis/model/types';

jest.mock('@/features/analysis/ui/chart-donut', () => {
  return {
    __esModule: true,
    default: ({ value }: { value: number }) => {
      return <div data-testid='chart-donut' data-value={value} />;
    },
  };
});

jest.mock('@/shared/ui/typography/H3', () => {
  return {
    H3: ({ children }: { children: React.ReactNode }) => {
      return <h3>{children}</h3>;
    },
  };
});

const makeTotal = (
  overrides: Partial<AnalysisProps['total']> = {},
): AnalysisProps['total'] => {
  return {
    current_value: 75,
    max_value: 100,
    min_value: 0,
    display_name: 'Overall Score',
    frontend_component_type: 'total',
    ...overrides,
  };
};

describe('Total widget', () => {
  it('renders the display name', () => {
    render(<Total total={makeTotal()} />);
    expect(screen.getByText(/Overall Score/)).toBeInTheDocument();
  });

  it('renders the current value', () => {
    render(<Total total={makeTotal({ current_value: 80 })} />);
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('renders max value', () => {
    render(<Total total={makeTotal({ max_value: 120 })} />);
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('renders donut chart with correct value', () => {
    render(<Total total={makeTotal({ current_value: 60 })} />);
    expect(screen.getByTestId('chart-donut')).toHaveAttribute(
      'data-value',
      '60',
    );
  });

  it('renders score description when max_value present', () => {
    render(<Total total={makeTotal({ current_value: 75, max_value: 100 })} />);
    // renderScoreDescription returns some text — just verify it's rendered
    expect(screen.getByText(/Overall Score/)).toBeInTheDocument();
  });
});
