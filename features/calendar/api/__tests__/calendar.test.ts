import { attachCalendar } from '@/features/calendar/api/calendar';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('attachCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns redirect URL on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, {
          data: { redirect: 'https://accounts.google.com/oauth' },
        }),
      );
    const url = await attachCalendar();

    expect(url).toBe('https://accounts.google.com/oauth');
  });

  it('throws user-friendly error on generic failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, { meta: {} }));
    await expect(attachCalendar()).rejects.toThrow(
      'Failed to connect Google Calendar. Please try again.',
    );
  });

  it('throws "already connected" error for SOURCE_ALREADY_EXISTS', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(422, { meta: { error_code: 'SOURCE_ALREADY_EXISTS' } }),
      );
    await expect(attachCalendar()).rejects.toThrow(
      'Google Calendar is already connected to your account.',
    );
  });

  it('throws generic error when response body is not JSON', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Internal Server Error'));
    await expect(attachCalendar()).rejects.toThrow(
      'Failed to connect Google Calendar. Please try again.',
    );
  });

  it('throws generic error when meta is missing error_code', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, { meta: {} }));
    await expect(attachCalendar()).rejects.toThrow(
      'Failed to connect Google Calendar. Please try again.',
    );
  });

  it('does not throw "already connected" for unrelated JSON errors', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(400, { meta: { error_code: 'SOME_OTHER_ERROR' } }),
      );
    await expect(attachCalendar()).rejects.toThrow(
      'Failed to connect Google Calendar. Please try again.',
    );
  });
});
