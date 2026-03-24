import { render, screen } from '@testing-library/react';

import { MethodologyCriteria } from '@/features/chat/ui/artifacts/methodology-criteria';

import type { MethodologyCriteriaBlock } from '@/features/chat/types';

/**
 * Helper to render a single block.
 * @param block - Block to render.
 * @returns Render result.
 */
const renderBlock = (block: MethodologyCriteriaBlock) => {
  return render(<MethodologyCriteria data={{ blocks: [block] }} />);
};

describe('MethodologyCriteria', () => {
  it('renders "No content" when blocks array is empty', () => {
    render(<MethodologyCriteria data={{ blocks: [] }} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  describe('header block', () => {
    it('renders header text', () => {
      renderBlock({ type: 'header', text: 'Assessment Results' });
      expect(screen.getByText('Assessment Results')).toBeInTheDocument();
    });
  });

  describe('scoring_table block', () => {
    it('renders column headers and rows', () => {
      renderBlock({
        type: 'scoring_table',
        columns: ['Criterion', 'Score'],
        rows: [
          ['Communication', 4],
          ['Leadership', 3],
        ],
      });
      expect(screen.getByText('Criterion')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Leadership')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('progress_summary block', () => {
    it('renders items with progress bar when max is provided', () => {
      renderBlock({
        type: 'progress_summary',
        items: [{ label: 'Completion', value: 7, max: 10 }],
      });
      expect(screen.getByText('Completion')).toBeInTheDocument();
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('renders plain value when max is null', () => {
      renderBlock({
        type: 'progress_summary',
        items: [{ label: 'Total', value: 42, max: null }],
      });
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('scale block', () => {
    it('renders title and score-label pairs', () => {
      renderBlock({
        type: 'scale',
        title: 'Rating Scale',
        items: [
          { score: 0, label: 'Not observed' },
          { score: 4, label: 'Excellent' },
        ],
      });
      expect(screen.getByText('Rating Scale')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Not observed')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
  });

  describe('text_list block', () => {
    it('renders title and list items', () => {
      renderBlock({
        type: 'text_list',
        title: 'Recommendations',
        items: ['Improve feedback', 'Set clear goals'],
      });
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Improve feedback')).toBeInTheDocument();
      expect(screen.getByText('Set clear goals')).toBeInTheDocument();
    });
  });

  it('renders multiple blocks in order', () => {
    render(
      <MethodologyCriteria
        data={{
          blocks: [
            { type: 'header', text: 'Section A' },
            { type: 'text_list', title: 'Items', items: ['One', 'Two'] },
          ],
        }}
      />,
    );
    expect(screen.getByText('Section A')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
