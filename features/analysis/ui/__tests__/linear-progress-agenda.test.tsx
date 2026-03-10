/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import LinearProgressAgenda from '@/features/analysis/ui/linear-progress-agenda';

import type { MetricItem } from '@/features/analysis/model/types';

jest.mock('@/features/analysis/ui/min-max', () => {
  return {
    __esModule: true,
    default: ({
      current_value,
      max_value,
    }: {
      current_value: number;
      max_value: number;
    }) => {
      return (
        <span data-testid='min-max'>
          {current_value}/{max_value}
        </span>
      );
    },
  };
});

const makeMetric = (overrides: Partial<MetricItem> = {}): MetricItem => {
  return {
    display_name: 'Communication Score',
    current_value: 75,
    max_value: 100,
    min_value: 0,
    frontend_component_type: 'linear',
    ...overrides,
  };
};

describe('LinearProgressAgenda', () => {
  it('renders the metric display name', () => {
    render(<LinearProgressAgenda {...makeMetric()} />);
    expect(screen.getByText('Communication Score')).toBeInTheDocument();
  });

  it('renders MinMax component', () => {
    render(<LinearProgressAgenda {...makeMetric()} />);
    expect(screen.getByTestId('min-max')).toBeInTheDocument();
  });

  it('passes correct values to MinMax', () => {
    render(
      <LinearProgressAgenda
        {...makeMetric({ current_value: 60, max_value: 80 })}
      />,
    );
    expect(screen.getByTestId('min-max')).toHaveTextContent('60/80');
  });
});
