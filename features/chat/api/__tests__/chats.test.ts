import {
  createChat,
  deleteChat,
  getChats,
  updateChatTitle,
} from '@/features/chat/api/chats';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockRedirect = jest.fn();

jest.mock('next/navigation', () => {
  return {
    /**
     *
     * @param {...any} args
     */
    redirect: (...args: unknown[]) => {
      return mockRedirect(...args);
    },
  };
});

jest.mock('@/shared/lib/config', () => {
  return {
    API_URL: 'https://api.test',
  };
});

jest.mock('@/shared/lib/getAuthToken', () => {
  return {
    getAuthHeaders: jest.fn(() => {
      return Promise.resolve({ Authorization: 'Bearer test-token' });
    }),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 *
 * @param status
 * @param body
 * @param headers
 */
function makeResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    url: 'https://api.test/chats',
    text: jest.fn(() => {
      return Promise.resolve(bodyText);
    }),
    json: jest.fn(() => {
      return Promise.resolve(body);
    }),
    headers: {
      /**
       *
       * @param key
       */
      get: (key: string) => {
        return headers[key] ?? null;
      },
    },
  } as unknown as Response;
}

const mockChat = {
  id: 1,
  title: 'Test Chat',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests — getChats
// ---------------------------------------------------------------------------
describe('getChats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns chats, totalCount, and hasMore on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockChat] },
          { 'Items-Count': '25' },
        ),
      );

    const result = await getChats(0, 20);

    expect(result.chats).toEqual([mockChat]);
    expect(result.totalCount).toBe(25);
    expect(result.hasMore).toBe(true);
  });

  it('returns hasMore=false when offset+limit >= totalCount', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockChat] },
          { 'Items-Count': '5' },
        ),
      );

    const result = await getChats(0, 20);

    expect(result.hasMore).toBe(false);
  });

  it('uses default offset=0 and limit=20', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: [] }, { 'Items-Count': '0' }),
      );

    await getChats();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/chats?offset=0&limit=20',
      expect.anything(),
    );
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(getChats()).rejects.toThrow();

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('throws on other non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Internal Server Error'));

    await expect(getChats()).rejects.toThrow('Internal Server Error');
  });

  it('throws when success=false in response body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: false, error: 'Something broke' }),
      );

    await expect(getChats()).rejects.toThrow('Something broke');
  });

  it('defaults totalCount to 0 when Items-Count header is absent', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    const result = await getChats();

    expect(result.totalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — createChat
// ---------------------------------------------------------------------------
describe('createChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns created chat data on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: mockChat }));

    const result = await createChat('My Chat');

    expect(result).toEqual(mockChat);
  });

  it('sends title in request body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: mockChat }));

    await createChat('Hello Chat');

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.title).toBe('Hello Chat');
  });

  it('omits title when no title is given', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: mockChat }));

    await createChat();

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body).not.toHaveProperty('title');
  });

  it('uses POST method', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: mockChat }));

    await createChat();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/chats',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(createChat()).rejects.toThrow();

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('throws on failure with message from body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(500, JSON.stringify({ message: 'Creation failed' })),
      );

    await expect(createChat()).rejects.toThrow('Creation failed');
  });
});

// ---------------------------------------------------------------------------
// Tests — updateChatTitle
// ---------------------------------------------------------------------------
describe('updateChatTitle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends PATCH request to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await updateChatTitle(42, 'Updated Title');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/chats/42',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('sends title in request body', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await updateChatTitle(42, 'My New Title');

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.title).toBe('My New Title');
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(updateChatTitle(1, 'title')).rejects.toThrow();

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('throws on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(500, JSON.stringify({ message: 'Update failed' })),
      );

    await expect(updateChatTitle(1, 'title')).rejects.toThrow('Update failed');
  });
});

// ---------------------------------------------------------------------------
// Tests — deleteChat
// ---------------------------------------------------------------------------
describe('deleteChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends DELETE request to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await deleteChat(99);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/chats/99',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('resolves without error on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await expect(deleteChat(1)).resolves.toBeUndefined();
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(deleteChat(1)).rejects.toThrow();

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('throws on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(404, JSON.stringify({ message: 'Chat not found' })),
      );

    await expect(deleteChat(999)).rejects.toThrow('Chat not found');
  });
});
