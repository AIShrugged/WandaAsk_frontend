import { render, screen } from '@testing-library/react';

import { TranscriptView } from '@/features/chat/ui/artifacts/transcript-view';

const baseData = {
  meeting_title: 'Weekly Sync',
  entries: [],
};
/**
 *
 * @param overrides
 */
const makeEntry = (overrides = {}) => {
  return {
    speaker: 'Alice',
    timestamp: '00:01:30',
    text: 'Let us start the meeting.',
    ...overrides,
  };
};

describe('TranscriptView', () => {
  it('renders "No transcript" when entries is empty', () => {
    render(<TranscriptView data={baseData} />);
    expect(screen.getByText('No transcript')).toBeInTheDocument();
  });

  it('renders speaker name', () => {
    render(
      <TranscriptView
        data={{ ...baseData, entries: [makeEntry({ speaker: 'Alice' })] }}
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(
      <TranscriptView
        data={{ ...baseData, entries: [makeEntry({ timestamp: '00:01:30' })] }}
      />,
    );
    expect(screen.getByText('00:01:30')).toBeInTheDocument();
  });

  it('renders transcript text', () => {
    render(
      <TranscriptView
        data={{
          ...baseData,
          entries: [makeEntry({ text: 'Let us start the meeting.' })],
        }}
      />,
    );
    expect(screen.getByText('Let us start the meeting.')).toBeInTheDocument();
  });

  it('renders initials for single-word speaker name', () => {
    render(
      <TranscriptView
        data={{ ...baseData, entries: [makeEntry({ speaker: 'Alice' })] }}
      />,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders two-letter initials for two-word speaker name', () => {
    render(
      <TranscriptView
        data={{
          ...baseData,
          entries: [makeEntry({ speaker: 'John Doe' })],
        }}
      />,
    );
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders multiple entries', () => {
    render(
      <TranscriptView
        data={{
          ...baseData,
          entries: [
            makeEntry({ speaker: 'Alice', text: 'Hello' }),
            makeEntry({ speaker: 'Bob', text: 'Hi there' }),
          ],
        }}
      />,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('gives the same color class to the same speaker in different entries', () => {
    const { container } = render(
      <TranscriptView
        data={{
          ...baseData,
          entries: [
            makeEntry({ speaker: 'Alice' }),
            makeEntry({ speaker: 'Alice' }),
          ],
        }}
      />,
    );
    const avatars = container.querySelectorAll('.rounded-full.flex-shrink-0');
    const classes0 = [...avatars[0].classList];
    const classes1 = [...avatars[1].classList];

    expect(classes0).toEqual(classes1);
  });
});
