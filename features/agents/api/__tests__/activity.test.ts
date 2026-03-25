import { getAgentActivity } from '@/features/agents/api/activity';

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
    url: 'https://api.test/agent-activity',
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

describe('getAgentActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns items, totalCount, and hasMore on success', async () => {
    const item = {
      id: 1,
      tool_name: 'create_artifact',
      description: 'Created an artifact',
      success: true,
      agent_run_uuid: '550e8400-e29b-41d4-a716-446655440000',
      created_at: '2026-03-24T14:00:00.000000Z',
    };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [item] },
          { 'Items-Count': '5' },
        ),
      );

    const result = await getAgentActivity();

    expect(result.items).toEqual([item]);
    expect(result.totalCount).toBe(5);
    expect(result.hasMore).toBe(true);
  });

  it('applies the requested agent_run_uuid filter', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    await getAgentActivity(10, 25, 'run-123');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/agent-activity?offset=10&limit=25&agent_run_uuid=run-123',
      expect.anything(),
    );
  });

  it('caps limit at 200', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    await getAgentActivity(0, 999);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/agent-activity?offset=0&limit=200',
      expect.anything(),
    );
  });
});
