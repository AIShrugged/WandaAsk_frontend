import { render, screen } from '@testing-library/react';
import React from 'react';

import Transcript from '@/features/transcript/ui/transcript';
import { ServerError } from '@/shared/lib/errors';

const TRANSCRIPT_API_MODULE = '@/features/transcript/api/transcript';
const TEST_URL = 'https://api/test';
const HISTORY_TESTID = 'transcript-history';

jest.mock('@/features/transcript/api/transcript', () => {
  return {
    loadTranscriptChunk: jest.fn(),
  };
});

jest.mock('@/features/transcript/ui/transcript-history', () => {
  return {
    __esModule: true,
    default: ({
      eventId,
      initialItems,
      initialTotal,
    }: {
      eventId: string;
      initialItems: unknown[];
      initialTotal: number;
    }) => {
      return (
        <div data-testid='transcript-history'>
          {eventId} — {initialTotal} — items:{initialItems.length}
        </div>
      );
    },
  };
});

describe('Transcript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders TranscriptHistory with event id, items and total count', async () => {
    const { loadTranscriptChunk } = jest.requireMock(TRANSCRIPT_API_MODULE);

    loadTranscriptChunk.mockResolvedValueOnce({
      items: [{ id: 1, text: 'Hello' }],
      totalCount: 1,
      hasMore: false,
    });

    render(await Transcript({ id: 'event-42' }));

    expect(screen.getByTestId(HISTORY_TESTID)).toHaveTextContent('event-42');
    expect(screen.getByTestId(HISTORY_TESTID)).toHaveTextContent('1');
    expect(screen.getByTestId(HISTORY_TESTID)).toHaveTextContent('items:1');
  });

  it('shows empty state when transcript has no items', async () => {
    const { loadTranscriptChunk } = jest.requireMock(TRANSCRIPT_API_MODULE);

    loadTranscriptChunk.mockResolvedValueOnce({
      items: [],
      totalCount: 0,
      hasMore: false,
    });

    render(await Transcript({ id: 'event-empty' }));

    expect(screen.queryByTestId(HISTORY_TESTID)).not.toBeInTheDocument();
    expect(screen.getByText('Transcript not available')).toBeInTheDocument();
    expect(
      screen.getByText('No transcript has been recorded for this meeting yet.'),
    ).toBeInTheDocument();
  });

  it('shows empty state when backend returns 404', async () => {
    const { loadTranscriptChunk } = jest.requireMock(TRANSCRIPT_API_MODULE);

    loadTranscriptChunk.mockRejectedValueOnce(
      new ServerError('Not found', { status: 404, url: TEST_URL }),
    );

    render(await Transcript({ id: 'event-404' }));

    expect(screen.queryByTestId(HISTORY_TESTID)).not.toBeInTheDocument();
    expect(screen.getByText('Transcript not available')).toBeInTheDocument();
  });

  it('re-throws non-404 errors', async () => {
    const { loadTranscriptChunk } = jest.requireMock(TRANSCRIPT_API_MODULE);

    loadTranscriptChunk.mockRejectedValueOnce(
      new ServerError('Internal error', { status: 500, url: TEST_URL }),
    );

    await expect(Transcript({ id: 'event-500' })).rejects.toThrow(
      'Internal error',
    );
  });
});
