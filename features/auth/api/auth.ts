'use server';

import { cookies } from 'next/headers';

import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/features/auth/model/schemas';
import { API_URL } from '@/shared/lib/config';

import type { ActionResult } from '@/shared/types/server-action';

// Auth endpoints use raw fetch because httpClient requires a Bearer token,
// but these actions run before any token exists (login bootstrap).
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // Also treat staging (NEXT_PUBLIC_APP_ENV=production) as secure context.
  secure:
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_APP_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;

function normalizeAuthRequestError(
  error: unknown,
  action: 'login' | 'registration' | 'password reset' | 'forgot password',
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
    if (res.status === 429)
      throw new Error('Too many attempts. Please wait a moment and try again.');
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

// eslint-disable-next-line max-statements
export async function register(data: RegisterInput): Promise<void> {
  const validated = RegisterSchema.parse(data);
  // Strip UI-only field before sending to backend.
  const payload = {
    name: validated.name,
    email: validated.email,
    password: validated.password,
    invite: validated.invite,
  };
  let res: Response;

  try {
    res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    if (res.status === 429)
      throw new Error('Too many attempts. Please wait a moment and try again.');
    throw new Error('Registration failed');
  }

  const responsePayload = json.data as Record<string, unknown> | null;
  const token = responsePayload?.token;

  if (typeof token !== 'string') {
    throw new TypeError('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: 'token',
    value: token,
    ...SESSION_COOKIE_OPTIONS,
  });

  const organizationId = responsePayload?.organization_id;

  if (typeof organizationId === 'number') {
    cookieStore.set({
      name: 'organization_id',
      value: String(organizationId),
      ...SESSION_COOKIE_OPTIONS,
    });
  }
}

export async function forgotPassword(
  data: ForgotPasswordInput,
): Promise<ActionResult<void>> {
  const validated = ForgotPasswordSchema.parse(data);
  let res: Response;

  try {
    res = await fetch(`${API_URL}/auth/password/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return {
      data: null,
      error: normalizeAuthRequestError(error, 'forgot password').message,
    };
  }

  if (!res.ok) {
    if (res.status === 429) {
      return {
        data: null,
        error: 'Too many attempts. Please wait a moment and try again.',
      };
    }

    return {
      data: null,
      error: 'Failed to send reset link. Please try again.',
    };
  }

  return { data: undefined, error: null };
}

export async function resetPassword(
  token: string,
  data: ResetPasswordInput,
): Promise<ActionResult<void>> {
  const validated = ResetPasswordSchema.parse(data);
  let res: Response;

  try {
    res = await fetch(`${API_URL}/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...validated }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    return {
      data: null,
      error: normalizeAuthRequestError(error, 'password reset').message,
    };
  }

  if (!res.ok) {
    if (res.status === 422) {
      return {
        data: null,
        error: 'This password reset link is invalid or has expired.',
      };
    }

    if (res.status === 429) {
      return {
        data: null,
        error: 'Too many attempts. Please wait a moment and try again.',
      };
    }

    return { data: null, error: 'Failed to reset password. Please try again.' };
  }

  return { data: undefined, error: null };
}
