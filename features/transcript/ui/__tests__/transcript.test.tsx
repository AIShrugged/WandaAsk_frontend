/* eslint-disable jsdoc/require-jsdoc */
import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('@/features/transcript/api/transcript', () => {
  return {
    loadTranscriptChunk: jest.fn().mockResolvedValue({
      data: [{ id: 1, speaker: 'Alice', text: 'Hello' }],
      totalCount: 1,
    }),
  };
});

jest.mock('@/features/transcript/ui/transcript-history', () => {
  return {
    __esModule: true,
    default: ({
      eventId,
      initialTotal,
    }: {
      eventId: string;
      initialTotal: number;
    }) => {
      return (
        <div data-testid='transcript-history'>
          {eventId} — {initialTotal}
        </div>
      );
    },
  };
});

import Transcript from '@/features/transcript/ui/transcript';

describe('Transcript', () => {
  it('renders TranscriptHistory with the event id and total count', async () => {
    render(await Transcript({ id: 'event-42' }));
    expect(screen.getByTestId('transcript-history')).toHaveTextContent(
      'event-42',
    );
    expect(screen.getByTestId('transcript-history')).toHaveTextContent('1');
  });
});
