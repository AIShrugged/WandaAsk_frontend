/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import Linear from '@/features/analysis/widgets/linear';

import type { MetricGroup } from '@/features/analysis/model/types';

jest.mock('@/features/analysis/ui/component-card', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid='component-card'>{children}</div>;
    },
  };
});

jest.mock('@/features/analysis/ui/linear-progress', () => {
  return {
    __esModule: true,
    default: ({ display_name }: { display_name: string }) => {
      return <div data-testid='linear-progress'>{display_name}</div>;
    },
  };
});

jest.mock('@/features/analysis/ui/linear-progress-agenda', () => {
  return {
    __esModule: true,
    default: ({ display_name }: { display_name: string }) => {
      return <div data-testid='linear-agenda'>{display_name}</div>;
    },
  };
});

jest.mock('@/features/analysis/ui/linear-progress-title', () => {
  return {
    __esModule: true,
    default: ({ title }: { title: string }) => {
      return <div>{title}</div>;
    },
  };
});

const makeMetricGroup = (overrides: Partial<MetricGroup> = {}): MetricGroup => {
  return {
    display_name: 'Communication',
    current_value: 70,
    max_value: 100,
    min_value: 0,
    frontend_component_type: 'linear',
    submetrics: [
      {
        display_name: 'Clarity',
        current_value: 80,
        max_value: 100,
        min_value: 0,
        frontend_component_type: 'linear',
      },
      {
        display_name: 'Tone',
        current_value: 60,
        max_value: 100,
        min_value: 0,
        frontend_component_type: 'linear',
      },
    ],
    ...overrides,
  };
};

describe('Linear widget', () => {
  it('renders the group display name', () => {
    render(<Linear {...makeMetricGroup()} />);
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders a card for each submetric', () => {
    render(<Linear {...makeMetricGroup()} />);
    expect(screen.getAllByTestId('component-card')).toHaveLength(2);
  });

  it('renders LinearProgress for each submetric', () => {
    render(<Linear {...makeMetricGroup()} />);
    expect(screen.getAllByTestId('linear-progress')).toHaveLength(2);
    expect(screen.getAllByTestId('linear-agenda')).toHaveLength(2);
  });

  it('renders empty grid for no submetrics', () => {
    render(<Linear {...makeMetricGroup({ submetrics: [] })} />);
    expect(screen.queryAllByTestId('component-card')).toHaveLength(0);
  });

  it('renders empty grid when submetrics is missing', () => {
    const group = {
      ...makeMetricGroup(),
      submetrics: undefined,
    } as unknown as MetricGroup;

    render(<Linear {...group} />);

    expect(screen.queryAllByTestId('component-card')).toHaveLength(0);
  });
});
