import { getArtifacts } from '@/entities/artifact/api/artifacts';

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

jest.mock('@/shared/lib/logger', () => {
  return {
    logApiError: jest.fn(),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 *
 * @param status
 * @param body
 */
function makeResponse(status: number, body: unknown): Response {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    url: 'https://api.test',
    text: jest.fn(() => {
      return Promise.resolve(bodyText);
    }),
    json: jest.fn(() => {
      return Promise.resolve(body);
    }),
    headers: {
      get: jest.fn(() => {
        return null;
      }),
    },
  } as unknown as Response;
}

const mockArtifacts = {
  chart: { type: 'bar', data: [] },
  people: [],
  meetings: [],
  tasks: [],
};

// ---------------------------------------------------------------------------
// Tests — getArtifacts
// ---------------------------------------------------------------------------
describe('getArtifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns artifact data on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockArtifacts }),
      );

    const result = await getArtifacts(1);

    expect(result).toEqual(mockArtifacts);
  });

  it('fetches from correct URL with chatId', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockArtifacts }),
      );

    await getArtifacts(42);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/chats/42/artifacts',
      expect.anything(),
    );
  });

  it('returns null on 404 (no artifacts)', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not found'));

    const result = await getArtifacts(1);

    expect(result).toBeNull();
  });

  it('calls redirect on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    // getArtifacts calls redirect() then returns null (doesn't throw in test env)
    await getArtifacts(1);

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('returns null on other non-ok status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(500, 'Error'));

    const result = await getArtifacts(1);

    expect(result).toBeNull();
  });

  it('returns null when success=false in response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: false, data: null }));

    const result = await getArtifacts(1);

    expect(result).toBeNull();
  });

  it('returns null when data is null in response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: null }));

    const result = await getArtifacts(1);

    expect(result).toBeNull();
  });
});
