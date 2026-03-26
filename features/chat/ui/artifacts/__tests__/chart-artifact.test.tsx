import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('recharts', () => {
  const Stub = ({
    children,
    'data-testid': testId,
  }: {
    children?: React.ReactNode;
    'data-testid'?: string;
  }) => {
    return <div data-testid={testId}>{children}</div>;
  };

  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    LineChart: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid='line-chart'>{children}</div>;
    },
    AreaChart: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid='area-chart'>{children}</div>;
    },
    BarChart: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid='bar-chart'>{children}</div>;
    },
    Line: ({ dataKey }: { dataKey: string }) => {
      return <div data-testid={`line-${dataKey}`} />;
    },
    Area: ({ dataKey }: { dataKey: string }) => {
      return <div data-testid={`area-${dataKey}`} />;
    },
    Bar: ({ dataKey }: { dataKey: string }) => {
      return <div data-testid={`bar-${dataKey}`} />;
    },
    CartesianGrid: Stub,
    XAxis: Stub,
    YAxis: Stub,
    Tooltip: Stub,
    Legend: Stub,
  };
});

import { ChartArtifactView } from '@/features/chat/ui/artifacts/chart-artifact';

import type { ChartArtifact } from '@/features/chat/types';

const makeData = (
  chart_type: ChartArtifact['data']['chart_type'],
): ChartArtifact['data'] => {
  return {
    chart_type,
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Sales', data: [10, 20, 30] },
      { label: 'Returns', data: [1, 2, 3] },
    ],
  };
};

describe('ChartArtifactView', () => {
  it('renders a LineChart for chart_type "line"', () => {
    render(<ChartArtifactView data={makeData('line')} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders Line elements for each dataset in line mode', () => {
    render(<ChartArtifactView data={makeData('line')} />);
    expect(screen.getByTestId('line-Sales')).toBeInTheDocument();
    expect(screen.getByTestId('line-Returns')).toBeInTheDocument();
  });

  it('renders an AreaChart for chart_type "area"', () => {
    render(<ChartArtifactView data={makeData('area')} />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders Area elements for each dataset in area mode', () => {
    render(<ChartArtifactView data={makeData('area')} />);
    expect(screen.getByTestId('area-Sales')).toBeInTheDocument();
    expect(screen.getByTestId('area-Returns')).toBeInTheDocument();
  });

  it('renders a BarChart by default for chart_type "bar"', () => {
    render(<ChartArtifactView data={makeData('bar')} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders Bar elements for each dataset in bar mode', () => {
    render(<ChartArtifactView data={makeData('bar')} />);
    expect(screen.getByTestId('bar-Sales')).toBeInTheDocument();
    expect(screen.getByTestId('bar-Returns')).toBeInTheDocument();
  });

  it('does not render AreaChart or BarChart for line type', () => {
    render(<ChartArtifactView data={makeData('line')} />);
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('handles empty datasets gracefully', () => {
    const data: ChartArtifact['data'] = {
      chart_type: 'bar',
      labels: ['A', 'B'],
      datasets: [],
    };

    render(<ChartArtifactView data={data} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('handles empty labels gracefully', () => {
    const data: ChartArtifact['data'] = {
      chart_type: 'line',
      labels: [],
      datasets: [{ label: 'Sales', data: [] }],
    };

    render(<ChartArtifactView data={data} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
