/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import Conclusion from '@/features/analysis/widgets/conclusion';

import type { AnalysisProps } from '@/features/analysis/model/types';

jest.mock('@/features/analysis/ui/conclusion-item', () => {
  return {
    ConclusionItem: ({ title, items }: { title: string; items: string[] }) => {
      return (
        <div data-testid='conclusion-item'>
          <span>{title}</span>
          {items.map((item, i) => {
            return <span key={i}>{item}</span>;
          })}
        </div>
      );
    },
  };
});

jest.mock('@/shared/ui/typography/H4', () => {
  return {
    H4: ({ children }: { children: React.ReactNode }) => {
      return <h4>{children}</h4>;
    },
  };
});

const makeConclusion = (): AnalysisProps['conclusion'] => {
  return {
    display_name: 'Key Insights',
    frontend_component_type: 'conclusion',
    value: [
      { display_name: 'Strengths', value: ['Communication', 'Teamwork'] },
      { display_name: 'Weaknesses', value: ['Time management'] },
    ],
  };
};

describe('Conclusion widget', () => {
  it('renders the section heading', () => {
    render(<Conclusion conclusion={makeConclusion()} />);
    expect(
      screen.getByRole('heading', { name: 'Key Insights' }),
    ).toBeInTheDocument();
  });

  it('renders all conclusion items', () => {
    render(<Conclusion conclusion={makeConclusion()} />);
    expect(screen.getAllByTestId('conclusion-item')).toHaveLength(2);
  });

  it('passes correct titles to ConclusionItem', () => {
    render(<Conclusion conclusion={makeConclusion()} />);
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('Weaknesses')).toBeInTheDocument();
  });
});
