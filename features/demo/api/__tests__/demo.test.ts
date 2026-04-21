import { deleteDemo } from '@/features/demo/api/delete-demo';
import { getDemoStatus } from '@/features/demo/api/get-demo-status';
import { seedDemo } from '@/features/demo/api/seed-demo';

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

import { redirect } from 'next/navigation';

const mockRedirect = redirect as unknown as jest.Mock;

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
// getDemoStatus
// ---------------------------------------------------------------------------
describe('getDemoStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns status data on success', async () => {
    const mockData = {
      status: 'ready',
      progress_percent: 100,
      current_step_label: null,
      error: null,
      completed_at: '2026-03-01T10:00:00Z',
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: mockData }));

    const result = await getDemoStatus();

    expect(result).toEqual(mockData);
  });

  it('returns null on 404', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not Found'));

    const result = await getDemoStatus();

    expect(result).toBeNull();
  });

  it('returns null when success=false or data=null', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: false, data: null }));

    const result = await getDemoStatus();

    expect(result).toBeNull();
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(getDemoStatus()).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('fetches the correct URL', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: { status: 'generating' } }),
      );

    await getDemoStatus();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/demo/status',
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// seedDemo
// ---------------------------------------------------------------------------
describe('seedDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns message on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: true,
        data: {
          status: 'pending',
          progress_percent: null,
          current_step_label: null,
        },
        message: 'Demo generation started',
      }),
    );

    const result = await seedDemo({});

    expect(result.message).toBe('Demo generation started');
  });

  it('falls back to default message when response message is missing', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: null }));

    const result = await seedDemo({});

    expect(result.message).toBe('Demo generation started');
  });

  it('sends params in request body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: null }));

    await seedDemo({
      teams_count: 3,
      employees_per_team: 5,
      meetings_per_team: 2,
    });

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.teams_count).toBe(3);
    expect(body.employees_per_team).toBe(5);
    expect(body.meetings_per_team).toBe(2);
  });

  it('redirects on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await expect(seedDemo({})).rejects.toThrow();
    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('throws with API message on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(422, { success: false, message: 'Demo already exists' }),
      );

    await expect(seedDemo({})).rejects.toThrow('Demo already exists');
  });

  it('throws default error when body is not JSON', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Internal Server Error'));

    await expect(seedDemo({})).rejects.toThrow(
      'Failed to generate demo data. Please try again.',
    );
  });
});

// ---------------------------------------------------------------------------
// deleteDemo
// ---------------------------------------------------------------------------
describe('deleteDemo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns { data: undefined, error: null } on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    const result = await deleteDemo();

    expect(result).toEqual({ data: undefined, error: null });
  });

  it('sends DELETE to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await deleteDemo();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/demo',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('calls redirect on 401', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, 'Unauthorized'));

    await deleteDemo();

    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/clear-session');
  });

  it('returns { error: "No demo data found." } on 404', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not Found'));

    const result = await deleteDemo();

    expect(result).toEqual({ data: null, error: 'No demo data found.' });
  });

  it('returns generic error message on other failures', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Internal Server Error'));

    const result = await deleteDemo();

    expect(result).toEqual({
      data: null,
      error: 'Failed to delete demo data. Please try again.',
    });
  });
});
