import { getFollowUp } from '@/features/follow-up/api/follow-up';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next/navigation', () => {
  return { redirect: jest.fn() };
});

jest.mock('@/shared/lib/config', () => {
  return { API_URL: 'https://api.test' };
});

jest.mock('@/shared/lib/getAuthToken', () => {
  return {
    getAuthHeaders: jest.fn(() => {
      return Promise.resolve({ Authorization: 'Bearer test-token' });
    }),
  };
});

jest.mock('@/shared/lib/logger', () => {
  return { logApiError: jest.fn() };
});

import { redirect } from 'next/navigation';

import { logApiError } from '@/shared/lib/logger';

const mockRedirect = redirect as jest.Mock;

const mockLogApiError = logApiError as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * @param status
 * @param body
 */
function makeResponse(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    /**
     *
     */
    text: () => {
      return Promise.resolve(text);
    },
    /**
     *
     */
    json: () => {
      return Promise.resolve(
        typeof body === 'string' ? JSON.parse(text) : body,
      );
    },
  } as unknown as Response;
}

const mockFollowUp = {
  id: 7,
  event_id: 3,
  team_id: 1,
  created_at: '2026-03-01T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('getFollowUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockFollowUp }),
      );

    const result = await getFollowUp(7);

    expect(result.data).toEqual(mockFollowUp);
  });

  it('fetches the correct URL with id', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockFollowUp }),
      );

    await getFollowUp(42);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/followups/42',
      expect.anything(),
    );
  });

  it('throws on 401 and redirects', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(getFollowUp(1)).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('logs error and throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Server Error'));

    await expect(getFollowUp(1)).rejects.toThrow(
      'Failed to load follow-up. Please try again.',
    );
    expect(mockLogApiError).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', status: 500 }),
    );
  });

  it('throws on 404', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not Found'));

    await expect(getFollowUp(99)).rejects.toThrow(
      'Failed to load follow-up. Please try again.',
    );
  });

  it('throws when success=false in response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: false,
        data: null,
        error: 'Invalid follow-up',
      }),
    );

    await expect(getFollowUp(1)).rejects.toThrow('Invalid follow-up');
  });

  it('throws default message when success=false and no error field', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: false, data: null }));

    await expect(getFollowUp(1)).rejects.toThrow('Invalid API response');
  });

  it('throws when data is null despite success=true', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: null }));

    await expect(getFollowUp(1)).rejects.toThrow('Invalid API response');
  });

  it('includes auth header in request', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockFollowUp }),
      );

    await getFollowUp(1);

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    expect((options.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-token',
    );
  });
});
