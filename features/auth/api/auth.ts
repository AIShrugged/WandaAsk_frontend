'use server';

import { cookies } from 'next/headers';

import {
  LoginSchema,
  RegisterSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/model/schemas';
import { API_URL } from '@/shared/lib/config';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;

/**
 * normalizeAuthRequestError converts DOMException/network failures into plain Error objects.
 * This avoids passing native TimeoutError instances through server actions.
 * @param error - unknown fetch error.
 * @param action - action label.
 * @returns Error.
 */
function normalizeAuthRequestError(
  error: unknown,
  action: 'login' | 'registration',
): Error {
  if (
    error instanceof Error &&
    (error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      error.message.includes('aborted due to timeout'))
  ) {
    return new Error(
      `Request timed out during ${action}. Please check the backend connection and try again.`,
    );
  }

  if (error instanceof Error) {
    return new Error(error.message);
  }

  return new Error(`Network error during ${action}. Please try again.`);
}

/**
 * parseJsonResponse.
 * @param res - res.
 * @returns Promise.
 */
async function parseJsonResponse(
  res: Response,
): Promise<Record<string, unknown>> {
  const text = await res.text();

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Server error. Please try again later.');
  }
}

/**
 * login.
 * @param data - data.
 * @returns Promise.
 */
export async function login(data: LoginInput): Promise<void> {
  const validated = LoginSchema.parse(data);
  let res: Response;

  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw normalizeAuthRequestError(error, 'login');
  }

  const json = await parseJsonResponse(res);

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid credentials');

    if (res.status === 422) throw new Error('Please check your input');
    throw new Error('Login failed');
  }

  const payload = json.data as Record<string, unknown> | null;
  const token = payload?.token;

  if (typeof token !== 'string') {
    throw new TypeError('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: 'token',
    value: token,
    ...SESSION_COOKIE_OPTIONS,
  });
}

/**
 * register.
 * @param data - data.
 * @returns Promise.
 */
// eslint-disable-next-line max-statements
export async function register(data: RegisterInput): Promise<void> {
  const validated = RegisterSchema.parse(data);
  let res: Response;

  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw normalizeAuthRequestError(error, 'registration');
  }

  const json = await parseJsonResponse(res);

  if (!res.ok) {
    if (res.status === 409)
      throw new Error('An account with this email already exists');

    if (res.status === 422) throw new Error('Please check your input');
    throw new Error('Registration failed');
  }

  const payload = json.data as Record<string, unknown> | null;
  const token = payload?.token;

  if (typeof token !== 'string') {
    throw new TypeError('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: 'token',
    value: token,
    ...SESSION_COOKIE_OPTIONS,
  });

  const organizationId = payload?.organization_id;

  if (typeof organizationId === 'number') {
    cookieStore.set({
      name: 'organization_id',
      value: String(organizationId),
      ...SESSION_COOKIE_OPTIONS,
    });
  }
}
