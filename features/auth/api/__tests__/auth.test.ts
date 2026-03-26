/* eslint-disable sonarjs/no-hardcoded-passwords */
import { login, register } from '@/features/auth/api/auth';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next/navigation', () => {
  return {
    redirect: jest.fn(),
  };
});

const mockCookieSet = jest.fn();

jest.mock('next/headers', () => {
  return {
    cookies: jest.fn(() => {
      return Promise.resolve({
        get: jest.fn(),
        set: mockCookieSet,
      });
    }),
  };
});

jest.mock('@/shared/lib/config', () => {
  return {
    API_URL: 'https://api.test',
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

// ---------------------------------------------------------------------------
// Tests — login
// ---------------------------------------------------------------------------
describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets token cookie on successful login', async () => {
    const mockToken = 'test-token-abc';

    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: { token: mockToken } }),
      );

    await login({ email: 'user@example.com', password: 'password123' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockCookieSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', value: mockToken }),
    );
  });

  it('throws on 401 Unauthorized', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(401, { message: 'Unauthenticated' }));

    await expect(
      login({ email: 'bad@example.com', password: 'wrongpass' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('throws on 422 Unprocessable Entity', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, { message: 'Validation failed' }));

    await expect(
      login({ email: 'a@b.com', password: 'xpassword' }),
    ).rejects.toThrow('Please check your input');
  });

  it('throws generic error on other non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(500, { message: 'Internal Server Error' }),
      );

    await expect(
      login({ email: 'a@b.com', password: 'xpassword' }),
    ).rejects.toThrow('Login failed');
  });

  it('throws TypeError when response has no token', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: { user: {} } }),
      );

    await expect(
      login({ email: 'a@b.com', password: 'password123' }),
    ).rejects.toThrow('Authentication failed');
  });

  it('throws on invalid JSON response', async () => {
    const res = {
      ok: true,
      status: 200,
      text: jest.fn(() => {
        return Promise.resolve('not-json');
      }),
    } as unknown as Response;

    globalThis.fetch = jest.fn().mockResolvedValue(res);

    await expect(
      login({ email: 'a@b.com', password: 'password123' }),
    ).rejects.toThrow('Server error');
  });

  it('sends credentials in request body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: { token: 'tok' } }),
      );

    await login({ email: 'user@test.com', password: 'pass123' });

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.email).toBe('user@test.com');
    expect(body.password).toBe('pass123');
  });

  it('converts timeout errors into plain login errors', async () => {
    const timeoutError = Object.create(Error.prototype) as Error;

    Object.defineProperty(timeoutError, 'name', {
      value: 'TimeoutError',
      configurable: true,
    });
    Object.defineProperty(timeoutError, 'message', {
      value: 'The operation was aborted due to timeout',
      configurable: true,
    });

    globalThis.fetch = jest.fn().mockRejectedValue(timeoutError);

    await expect(
      login({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toThrow(
      'Request timed out during login. Please check the backend connection and try again.',
    );
  });
});

// ---------------------------------------------------------------------------
// Tests — register
// ---------------------------------------------------------------------------
describe('register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets token cookie on successful registration', async () => {
    const mockToken = 'register-token';

    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: true,
        data: { token: mockToken, organization_id: 5 },
      }),
    );

    await register({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(mockCookieSet).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', value: mockToken }),
    );
  });

  it('sets organization_id cookie when organization_id is in response', async () => {
    const orgId = 42;

    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: true,
        data: { token: 'tok', organization_id: orgId },
      }),
    );

    await register({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(mockCookieSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'organization_id',
        value: String(orgId),
      }),
    );
  });

  it('does not set organization_id cookie when missing from response', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(200, { success: true, data: { token: 'tok' } }),
      );

    await register({
      name: 'Test User',
      email: 'new@example.com',
      password: 'password123',
    });

    const orgCookieCall = mockCookieSet.mock.calls.find(
      ([opts]: [{ name: string }]) => {
        return opts.name === 'organization_id';
      },
    );

    expect(orgCookieCall).toBeUndefined();
  });

  it('throws on 409 Conflict (duplicate email)', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(409, { message: 'Email taken' }));

    await expect(
      register({
        name: 'Test User',
        email: 'dup@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('An account with this email already exists');
  });

  it('throws on 422 Unprocessable Entity', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, { message: 'Validation failed' }));

    await expect(
      register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'xpassword',
      }),
    ).rejects.toThrow('Please check your input');
  });

  it('throws generic error on other non-ok status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(500, { message: 'Internal Server Error' }),
      );

    await expect(
      register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Registration failed');
  });

  it('makes POST request to /auth/register', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(200, {
        success: true,
        data: { token: 'tok', organization_id: 1 },
      }),
    );

    await register({
      name: 'Test Name',
      email: 'name@example.com',
      password: 'password123',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('converts timeout errors into plain registration errors', async () => {
    const timeoutError = Object.create(Error.prototype) as Error;

    Object.defineProperty(timeoutError, 'name', {
      value: 'TimeoutError',
      configurable: true,
    });
    Object.defineProperty(timeoutError, 'message', {
      value: 'The operation was aborted due to timeout',
      configurable: true,
    });

    globalThis.fetch = jest.fn().mockRejectedValue(timeoutError);

    await expect(
      register({
        name: 'Test User',
        email: 'new@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(
      'Request timed out during registration. Please check the backend connection and try again.',
    );
  });
});
