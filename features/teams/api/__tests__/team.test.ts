import {
  createTeam,
  deleteTeam,
  getTeamFollowUp,
  getTeamFollowUps,
  loadTeamsChunk,
  sendInvite,
  updateTeam,
} from '@/features/teams/api/team';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next/navigation', () => {
  return {
    redirect: jest.fn(),
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

jest.mock('@/shared/lib/httpClient', () => {
  return {
    httpClient: jest.fn(),
  };
});

import { httpClient } from '@/shared/lib/httpClient';

const mockHttpClient = jest.mocked(httpClient);

// revalidatePath is auto-mocked via __mocks__/next-cache.js

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
    url: 'https://api.test',
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

const mockTeam = {
  id: 1,
  name: 'Alpha',
  slug: 'alpha',
  employee_count: 5,
  members: [],
};

// ---------------------------------------------------------------------------
// Tests — loadTeamsChunk
// ---------------------------------------------------------------------------
describe('loadTeamsChunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data, totalCount, and hasMore on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockTeam] },
          { 'Items-Count': '15' },
        ),
      );

    const result = await loadTeamsChunk('5', 0, 10);

    expect(result.data).toEqual([mockTeam]);
    expect(result.totalCount).toBe(15);
    expect(result.hasMore).toBe(true);
  });

  it('returns hasMore=false when all teams loaded', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockTeam] },
          { 'Items-Count': '1' },
        ),
      );

    const result = await loadTeamsChunk('5', 0, 10);

    expect(result.hasMore).toBe(false);
  });

  it('builds correct URL with org id, offset, and limit', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: [] }, { 'Items-Count': '0' }),
      );

    await loadTeamsChunk('9', 20, 5);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/organizations/9/teams?offset=20&limit=5',
      expect.anything(),
    );
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Server error'));

    await expect(loadTeamsChunk('5', 0, 10)).rejects.toThrow();
  });

  it('throws when success=false in response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: false, error: 'Not found' }),
      );

    await expect(loadTeamsChunk('5', 0, 10)).rejects.toThrow('Not found');
  });

  it('defaults totalCount to 0 when header absent', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    const result = await loadTeamsChunk('5', 0, 10);

    expect(result.totalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — deleteTeam
// ---------------------------------------------------------------------------
describe('deleteTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends DELETE to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await deleteTeam(42);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/teams/42',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('resolves undefined on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    const result = await deleteTeam(1);

    expect(result).toBeUndefined();
  });

  it('returns error text on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Team not found'));

    const result = await deleteTeam(999);

    expect(result).toBe('Team not found');
  });
});

// ---------------------------------------------------------------------------
// Tests — createTeam
// ---------------------------------------------------------------------------
describe('createTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends POST to /teams', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await createTeam('5', { name: 'Beta' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/teams',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('includes organization_id in body', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await createTeam('7', { name: 'Gamma' });

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.organization_id).toBe('7');
    expect(body.name).toBe('Gamma');
  });

  it('returns { error: null } on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    const result = await createTeam('5', { name: 'Team' });

    expect(result).toEqual({ error: null });
  });

  it('returns { error: string } on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, 'Validation error'));

    const result = await createTeam('5', { name: 'T' });

    expect(result.error).toBeTruthy();
  });

  it('returns default error message when response body is empty', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(500, ''));

    const result = await createTeam('5', { name: 'T' });

    expect(result.error).toBe('Failed to create team');
  });
});

// ---------------------------------------------------------------------------
// Tests — updateTeam
// ---------------------------------------------------------------------------
describe('updateTeam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient.mockResolvedValue({ data: mockTeam });
  });

  it('calls httpClient with PUT method and correct URL', async () => {
    await updateTeam(3, { name: 'Updated' });

    expect(mockHttpClient).toHaveBeenCalledWith(
      'https://api.test/teams/3',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('resolves without error on success', async () => {
    await expect(updateTeam(3, { name: 'Updated' })).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests — getTeamFollowUps
// ---------------------------------------------------------------------------
describe('getTeamFollowUps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns follow-ups data on success', async () => {
    const mockFollowUps = [{ id: 1, team_id: 1 }];

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockFollowUps }),
      );

    const result = await getTeamFollowUps(1);

    expect(result.data).toEqual(mockFollowUps);
  });

  it('builds correct URL with teamId', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    await getTeamFollowUps(99);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/teams/99/followups',
      expect.anything(),
    );
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(500, 'Error'));

    await expect(getTeamFollowUps(1)).rejects.toThrow();
  });

  it('throws when success=false', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: false, error: 'Invalid' }),
      );

    await expect(getTeamFollowUps(1)).rejects.toThrow('Invalid');
  });
});

// ---------------------------------------------------------------------------
// Tests — getTeamFollowUp
// ---------------------------------------------------------------------------
describe('getTeamFollowUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns followup data on success', async () => {
    const followUpData = { id: 10, event_id: 5 };

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: followUpData }),
      );

    const result = await getTeamFollowUp(5);

    expect(result.data).toEqual(followUpData);
  });

  it('builds correct URL with calendarEventId', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: {} }));

    await getTeamFollowUp(77);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/calendar-events/77/followup',
      expect.anything(),
    );
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not found'));

    await expect(getTeamFollowUp(1)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests — sendInvite
// ---------------------------------------------------------------------------
describe('sendInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data and message on success', async () => {
    const responseData = { invite_id: 1 };

    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: true,
        data: responseData,
        message: 'Invite sent',
      }),
    );

    const result = await sendInvite(1, { email: 'user@example.com' });

    expect(result.data).toEqual(responseData);
    expect(result.message).toBe('Invite sent');
  });

  it('sends POST to correct URL', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: {}, message: 'OK' }),
      );

    await sendInvite(3, { email: 'a@b.com' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/teams/3/invites',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends member data in body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: {}, message: 'OK' }),
      );

    await sendInvite(1, { email: 'member@example.com' });

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.email).toBe('member@example.com');
  });

  it('throws when response is not ok', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(422, { success: false, message: 'User already in team' }),
      );

    await expect(sendInvite(1, { email: 'a@b.com' })).rejects.toThrow(
      'User already in team',
    );
  });

  it('throws with default message when no message in body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, { success: false }));

    await expect(sendInvite(1, { email: 'a@b.com' })).rejects.toThrow(
      'Failed to send invite',
    );
  });
});
