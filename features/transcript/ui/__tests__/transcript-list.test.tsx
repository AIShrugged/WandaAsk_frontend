/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';

import TranscriptList from '@/features/transcript/ui/transcript-list';

import type { TranscriptProps } from '@/features/transcript/model/types';

const makeItem = (
  overrides: Partial<TranscriptProps> = {},
): TranscriptProps => {
  return {
    id: 1,
    text: 'Hello world',
    start_relative: '5000',
    end_relative: '8000',
    start_absolute: '2024-03-15T10:00:05',
    end_absolute: '2024-03-15T10:00:08',
    participant: { id: 1, calendar_event_id: 1, name: 'Alice' },
    ...overrides,
  };
};

describe('TranscriptList', () => {
  it('renders transcript text', () => {
    render(<TranscriptList data={[makeItem()]} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders participant name', () => {
    render(<TranscriptList data={[makeItem()]} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders multiple items', () => {
    render(
      <TranscriptList
        data={[
          makeItem({
            id: 1,
            text: 'First line',
            participant: { id: 1, calendar_event_id: 1, name: 'Alice' },
          }),
          makeItem({
            id: 2,
            text: 'Second line',
            participant: { id: 2, calendar_event_id: 1, name: 'Bob' },
          }),
        ]}
      />,
    );
    expect(screen.getByText('First line')).toBeInTheDocument();
    expect(screen.getByText('Second line')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders timestamp for each item', () => {
    render(<TranscriptList data={[makeItem({ start_relative: '90' })]} />);
    // 90 seconds → 01:30.00
    expect(screen.getByText('01:30.00')).toBeInTheDocument();
  });

  it('returns nothing for empty array', () => {
    const { container } = render(<TranscriptList data={[]} />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
