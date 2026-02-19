'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  LoginSchema,
  RegisterSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/model/schemas';
import { API_URL } from '@/shared/lib/config';
import { ROUTES } from '@/shared/lib/routes';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('Server error. Please try again later.');
  }
}

export async function login(data: LoginInput): Promise<void> {
  const validated = LoginSchema.parse(data);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  const json = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : 'Login failed');
  }

  if (typeof json.token !== 'string') {
    throw new TypeError('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();
  cookieStore.set({ name: 'token', value: json.token, ...SESSION_COOKIE_OPTIONS });

  redirect(ROUTES.AUTH.ORGANIZATION);
}

export async function register(data: RegisterInput): Promise<void> {
  const validated = RegisterSchema.parse(data);

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  const json = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : 'Registration failed');
  }

  if (typeof json.token !== 'string') {
    throw new TypeError('Authentication failed. Please try again.');
  }

  const cookieStore = await cookies();
  cookieStore.set({ name: 'token', value: json.token, ...SESSION_COOKIE_OPTIONS });

  if (typeof json.organization_id === 'string') {
    cookieStore.set({ name: 'organization_id', value: json.organization_id, ...SESSION_COOKIE_OPTIONS });
  }

  redirect(ROUTES.AUTH.ORGANIZATION);
}
