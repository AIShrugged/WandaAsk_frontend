import {
  createMethodology,
  deleteMethodology,
  getMethodology,
  loadMethodologiesChunk,
  updateMethodology,
} from '@/features/methodology/api/methodology';

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

const mockMethodology = {
  id: 1,
  name: 'Agile',
  text: 'Agile methodology',
  organization_id: 10,
  team_ids: [1, 2],
};

const mockDTO = {
  name: 'Agile',
  text: 'Agile methodology',
  organization_id: '10',
  team_ids: ['1', '2'],
};

// ---------------------------------------------------------------------------
// Tests — loadMethodologiesChunk
// ---------------------------------------------------------------------------
describe('loadMethodologiesChunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns data, totalCount, and hasMore on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockMethodology] },
          { 'Items-Count': '30' },
        ),
      );

    const result = await loadMethodologiesChunk('10', 0, 10);

    expect(result.data).toEqual([mockMethodology]);
    expect(result.totalCount).toBe(30);
    expect(result.hasMore).toBe(true);
  });

  it('returns hasMore=false when all loaded', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(
          200,
          { success: true, data: [mockMethodology] },
          { 'Items-Count': '1' },
        ),
      );

    const result = await loadMethodologiesChunk('10', 0, 10);

    expect(result.hasMore).toBe(false);
  });

  it('builds correct URL with organizationId, offset, and limit', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: [] }, { 'Items-Count': '0' }),
      );

    await loadMethodologiesChunk('5', 20, 10);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/organizations/5/methodologies?offset=20&limit=10',
      expect.anything(),
    );
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Internal Error'));

    await expect(loadMethodologiesChunk('10', 0, 10)).rejects.toThrow(
      'getMethodologies failed',
    );
  });

  it('throws when success=false in response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: false, error: 'Not found' }),
      );

    await expect(loadMethodologiesChunk('10', 0, 10)).rejects.toThrow(
      'Not found',
    );
  });

  it('defaults totalCount to 0 when header absent', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true, data: [] }));

    const result = await loadMethodologiesChunk('10', 0, 10);

    expect(result.totalCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — createMethodology
// ---------------------------------------------------------------------------
describe('createMethodology', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves without error on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await expect(createMethodology(mockDTO)).resolves.toBeUndefined();
  });

  it('sends POST to /methodologies', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await createMethodology(mockDTO);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/methodologies',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('converts organization_id to Number in payload', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await createMethodology(mockDTO);

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.organization_id).toBe(10);
    expect(typeof body.organization_id).toBe('number');
  });

  it('converts team_ids strings to numbers in payload', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(201, {}));

    await createMethodology(mockDTO);

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];

    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.teams_ids).toEqual([1, 2]);
  });

  it('throws on failure', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, 'Validation error'));

    await expect(createMethodology(mockDTO)).rejects.toThrow(
      'createOrganization failed',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — updateMethodology
// ---------------------------------------------------------------------------
describe('updateMethodology', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends PUT to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await updateMethodology(7, mockDTO);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/methodologies/7',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('resolves without error on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await expect(updateMethodology(7, mockDTO)).resolves.toBeUndefined();
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not found'));

    await expect(updateMethodology(999, mockDTO)).rejects.toThrow(
      'updateMethodology failed',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — getMethodology
// ---------------------------------------------------------------------------
describe('getMethodology', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns methodology data on success', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockMethodology }),
      );

    const result = await getMethodology('1');

    expect(result.data).toEqual(mockMethodology);
  });

  it('builds correct URL with methodology_id', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: mockMethodology }),
      );

    await getMethodology('42');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/methodologies/42',
      expect.anything(),
    );
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not found'));

    await expect(getMethodology('999')).rejects.toThrow(
      'getMethodologies failed',
    );
  });

  it('throws when success=false in response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: false, error: 'No data' }),
      );

    await expect(getMethodology('1')).rejects.toThrow('No data');
  });
});

// ---------------------------------------------------------------------------
// Tests — deleteMethodology
// ---------------------------------------------------------------------------
describe('deleteMethodology', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends DELETE to correct URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await deleteMethodology(5);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/methodologies/5',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('resolves without error on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeResponse(200, {}));

    await expect(deleteMethodology(5)).resolves.toBeUndefined();
  });

  it('throws on non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(404, 'Not found'));

    await expect(deleteMethodology(999)).rejects.toThrow(
      'deleteMethodology failed',
    );
  });
});
