/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import Summary from '@/features/analysis/widgets/summary';

import type { MetricGroup } from '@/features/analysis/model/types';

jest.mock('@/features/analysis/ui/component-card', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid='component-card'>{children}</div>;
    },
  };
});

jest.mock('@/features/analysis/ui/min-max', () => {
  return {
    __esModule: true,
    default: ({ current_value }: { current_value: number }) => {
      return <span data-testid='min-max'>{current_value}</span>;
    },
  };
});

const makeMetric = (name: string, score: number): MetricGroup => {
  return {
    display_name: name,
    current_value: score,
    max_value: 100,
    min_value: 0,
    frontend_component_type: 'linear',
    submetrics: [],
  };
};

describe('Summary widget', () => {
  it('returns null for empty metrics', () => {
    const { container } = render(<Summary metrics={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows maximum contribution label', () => {
    render(
      <Summary metrics={[makeMetric('Clarity', 90), makeMetric('Tone', 40)]} />,
    );
    expect(screen.getByText('Maximum contribution')).toBeInTheDocument();
  });

  it('shows growth focus label', () => {
    render(
      <Summary metrics={[makeMetric('Clarity', 90), makeMetric('Tone', 40)]} />,
    );
    expect(screen.getByText('The main focus is on growth')).toBeInTheDocument();
  });

  it('renders max metric display name', () => {
    render(
      <Summary metrics={[makeMetric('Clarity', 90), makeMetric('Tone', 40)]} />,
    );
    expect(screen.getByText('Clarity')).toBeInTheDocument();
  });

  it('renders min metric display name', () => {
    render(
      <Summary metrics={[makeMetric('Clarity', 90), makeMetric('Tone', 40)]} />,
    );
    expect(screen.getByText('Tone')).toBeInTheDocument();
  });

  it('renders two component cards when metrics present', () => {
    render(<Summary metrics={[makeMetric('A', 80), makeMetric('B', 20)]} />);
    expect(screen.getAllByTestId('component-card')).toHaveLength(2);
  });
});
