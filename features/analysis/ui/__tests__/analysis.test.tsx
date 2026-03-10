/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import Analysis from '@/features/analysis/ui/analysis';

jest.mock('@/features/analysis/widgets/total', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='total' />;
    },
  };
});
jest.mock('@/features/analysis/widgets/summary', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='summary' />;
    },
  };
});
jest.mock('@/features/analysis/widgets/linear', () => {
  return {
    __esModule: true,
    default: ({ display_name }: { display_name: string }) => {
      return <div data-testid='linear'>{display_name}</div>;
    },
  };
});
jest.mock('@/features/analysis/widgets/conclusion', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='conclusion' />;
    },
  };
});

const validData = JSON.stringify({
  total: {
    current_value: 80,
    max_value: 100,
    min_value: 0,
    display_name: 'Score',
    frontend_component_type: 'total',
  },
  metrics: [
    {
      display_name: 'Communication',
      current_value: 70,
      max_value: 100,
      min_value: 0,
      frontend_component_type: 'linear',
      submetrics: [],
    },
  ],
  conclusion: {
    display_name: 'Insights',
    frontend_component_type: 'conclusion',
    value: [],
  },
});

describe('Analysis', () => {
  it('renders "Error in JSON" for invalid JSON', async () => {
    render(await Analysis({ data: 'bad json' }));
    expect(screen.getByText('Error in JSON')).toBeInTheDocument();
  });

  it('renders Total component', async () => {
    render(await Analysis({ data: validData }));
    expect(screen.getByTestId('total')).toBeInTheDocument();
  });

  it('renders Summary component', async () => {
    render(await Analysis({ data: validData }));
    expect(screen.getByTestId('summary')).toBeInTheDocument();
  });

  it('renders Linear component for each metric', async () => {
    render(await Analysis({ data: validData }));
    expect(screen.getByTestId('linear')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });

  it('renders Conclusion component', async () => {
    render(await Analysis({ data: validData }));
    expect(screen.getByTestId('conclusion')).toBeInTheDocument();
  });
});
