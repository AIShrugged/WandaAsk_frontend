import { render, screen } from '@testing-library/react';

import TranscriptHistory from '@/features/transcript/ui/transcript-history';

import type {
  TranscriptProps,
  TranscriptsProps,
} from '@/features/transcript/model/types';

jest.mock('@/features/transcript/api/transcript', () => {
  return {
    loadTranscriptChunk: jest.fn(),
  };
});

jest.mock('@/features/transcript/ui/transcript-list', () => {
  return {
    __esModule: true,
    default: ({ data }: { data: TranscriptProps[] }) => {
      return <div data-testid='transcript-list'>items:{data.length}</div>;
    },
  };
});

jest.mock('@/shared/ui/layout/spin-loader', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='spin-loader' />;
    },
  };
});

jest.mock('@/shared/ui/layout/infinite-scroll-status', () => {
  return {
    InfiniteScrollStatus: ({ itemCount }: { itemCount: number }) => {
      return <div data-testid='scroll-status'>loaded:{itemCount}</div>;
    },
  };
});

beforeAll(() => {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation(() => {
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
      };
    }),
  });
});

const makeTranscript = (id: number): TranscriptProps => {
  return {
    id,
    text: `Line ${id}`,
    start_absolute: '2024-01-01T10:00:00Z',
    start_relative: '60',
    end_absolute: '2024-01-01T10:01:00Z',
    end_relative: '120',
    participant: {
      id: id,
      name: `Speaker ${id}`,
    } as TranscriptProps['participant'],
  };
};
const makeTranscriptsData = (items: TranscriptProps[]): TranscriptsProps => {
  return {
    data: items,
    message: 'ok',
    meta: [],
    status: 200,
    success: true,
  };
};

describe('TranscriptHistory', () => {
  it('renders TranscriptList with initial items', () => {
    const items = [makeTranscript(1), makeTranscript(2)];

    render(
      <TranscriptHistory
        eventId='1'
        initialData={makeTranscriptsData(items)}
        initialTotal={2}
      />,
    );

    expect(screen.getByTestId('transcript-list')).toHaveTextContent('items:2');
  });

  it('renders InfiniteScrollStatus when all items loaded', () => {
    const items = [makeTranscript(1), makeTranscript(2)];

    render(
      <TranscriptHistory
        eventId='1'
        initialData={makeTranscriptsData(items)}
        initialTotal={2}
      />,
    );

    expect(screen.getByTestId('scroll-status')).toHaveTextContent('loaded:2');
  });

  it('does not show scroll status when hasMore is true', () => {
    const items = [makeTranscript(1)];

    render(
      <TranscriptHistory
        eventId='1'
        initialData={makeTranscriptsData(items)}
        initialTotal={10}
      />,
    );

    expect(screen.queryByTestId('scroll-status')).not.toBeInTheDocument();
  });

  it('does not show spin loader initially', () => {
    render(
      <TranscriptHistory
        eventId='1'
        initialData={makeTranscriptsData([])}
        initialTotal={0}
      />,
    );

    expect(screen.queryByTestId('spin-loader')).not.toBeInTheDocument();
  });

  it('renders with empty initial data', () => {
    render(
      <TranscriptHistory
        eventId='1'
        initialData={makeTranscriptsData([])}
        initialTotal={0}
      />,
    );

    expect(screen.getByTestId('transcript-list')).toHaveTextContent('items:0');
  });
});
