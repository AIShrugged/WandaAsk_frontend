import { loadTranscriptChunk } from '@/features/transcript/api/transcript';

jest.mock('@/shared/lib/config', () => {
  return { API_URL: 'https://api' };
});

jest.mock('@/shared/lib/httpClient', () => {
  return {
    httpClientList: jest.fn(),
  };
});

const HTTP_CLIENT_MODULE = '@/shared/lib/httpClient';

describe('loadTranscriptChunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls httpClientList with the correct URL including offset and limit', async () => {
    const { httpClientList } = jest.requireMock(HTTP_CLIENT_MODULE);

    httpClientList.mockResolvedValueOnce({
      data: [],
      totalCount: 0,
      hasMore: false,
    });

    await loadTranscriptChunk('event-1', 0, 10);

    expect(httpClientList).toHaveBeenCalledWith(
      'https://api/calendar-events/event-1/transcript?offset=0&limit=10',
    );
  });

  it('passes non-zero offset correctly in the URL', async () => {
    const { httpClientList } = jest.requireMock(HTTP_CLIENT_MODULE);

    httpClientList.mockResolvedValueOnce({
      data: [],
      totalCount: 50,
      hasMore: true,
    });

    await loadTranscriptChunk('event-2', 20, 10);

    expect(httpClientList).toHaveBeenCalledWith(
      'https://api/calendar-events/event-2/transcript?offset=20&limit=10',
    );
  });

  it('returns hasMore=true when more items are available', async () => {
    const { httpClientList } = jest.requireMock(HTTP_CLIENT_MODULE);

    httpClientList.mockResolvedValueOnce({
      data: [{ id: 1, text: 'Hello' }],
      totalCount: 50,
      hasMore: true,
    });

    const result = await loadTranscriptChunk('event-3', 0, 10);

    expect(result.hasMore).toBe(true);
    expect(result.totalCount).toBe(50);
  });

  it('returns hasMore=false when all items are fetched', async () => {
    const { httpClientList } = jest.requireMock(HTTP_CLIENT_MODULE);

    httpClientList.mockResolvedValueOnce({
      data: [
        { id: 1, text: 'Hello' },
        { id: 2, text: 'World' },
      ],
      totalCount: 2,
      hasMore: false,
    });

    const result = await loadTranscriptChunk('event-4', 0, 10);

    expect(result.hasMore).toBe(false);
  });

  it('returns items as a flat array', async () => {
    const { httpClientList } = jest.requireMock(HTTP_CLIENT_MODULE);

    const mockItems = [
      { id: 1, text: 'Line 1' },
      { id: 2, text: 'Line 2' },
    ];

    httpClientList.mockResolvedValueOnce({
      data: mockItems,
      totalCount: 2,
      hasMore: false,
    });

    const result = await loadTranscriptChunk('event-5', 0, 10);

    expect(result.items).toEqual(mockItems);
    expect(result.items).toHaveLength(2);
  });
});
