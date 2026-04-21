/* eslint-disable sonarjs/no-hardcoded-passwords */
import {
  changePassword,
  updateProfile,
} from '@/features/user-profile/api/profile';

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

// revalidatePath is mapped to __mocks__/next-cache.js automatically

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
    url: 'https://api.test/users/me',
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

// ---------------------------------------------------------------------------
// Tests — updateProfile
// ---------------------------------------------------------------------------
describe('updateProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success result when update succeeds', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    const result = await updateProfile({ name: 'Alice' });

    expect(result.error).toBeNull();
  });

  it('sends PATCH request to /users/me', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    await updateProfile({ name: 'Bob' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/users/me',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('sends name in request body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    await updateProfile({ name: 'Charlie' });

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.name).toBe('Charlie');
  });

  it('returns error result when update fails', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Server error'));

    const result = await updateProfile({ name: 'Alice' });

    expect(result.error).toBe('Failed to update profile. Please try again.');
    expect(result.data).toBeNull();
  });

  it('returns error result on 422 validation error', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(422, { message: 'Validation failed' }));

    const result = await updateProfile({ name: '' });

    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — changePassword
// ---------------------------------------------------------------------------
describe('changePassword', () => {
  const validPayload = {
    current_password: 'oldpass123',
    password: 'newpass456',
    password_confirmation: 'newpass456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns success result when password change succeeds', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    const result = await changePassword(validPayload);

    expect(result.error).toBeNull();
  });

  it('sends PATCH request to /users/me', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    await changePassword(validPayload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/users/me',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('sends all password fields in request body', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(200, { success: true }));

    await changePassword(validPayload);

    const [, options] = (globalThis.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(options.body as string) as Record<string, unknown>;

    expect(body.current_password).toBe('oldpass123');
    expect(body.password).toBe('newpass456');
    expect(body.password_confirmation).toBe('newpass456');
  });

  it('returns INVALID_CURRENT_PASSWORD errorCode when meta error_code matches', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(422, {
        message: 'Wrong password',
        meta: { error_code: 'INVALID_CURRENT_PASSWORD' },
      }),
    );

    const result = await changePassword(validPayload);

    expect(result.error).toBe('Current password is incorrect');
    expect(result.data).toBeNull();

    // TypeScript union — narrow to error branch
    if (result.error !== null) {
      expect((result as { errorCode?: string }).errorCode).toBe(
        'INVALID_CURRENT_PASSWORD',
      );
    }
  });

  it('returns message from response body when present', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      makeResponse(422, {
        message: 'Password too short',
        meta: {},
      }),
    );

    const result = await changePassword(validPayload);

    expect(result.error).toBe('Password too short');
  });

  it('returns generic error when response body is not JSON', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeResponse(500, 'Not JSON text here'));

    const result = await changePassword(validPayload);

    expect(result.error).toBe('Failed to change password. Please try again.');
    expect(result.data).toBeNull();
  });

  it('returns generic error when error body JSON has no relevant fields', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        makeResponse(500, JSON.stringify({ irrelevant: true })),
      );

    const result = await changePassword(validPayload);

    expect(result.error).toBe('Failed to change password. Please try again.');
  });
});
