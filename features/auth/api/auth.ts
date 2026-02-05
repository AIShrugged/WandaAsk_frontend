'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { API_URL } from '@/app/constants/config';
import {
  LoginSchema,
  RegisterSchema,
  type LoginInput,
  type RegisterInput,
} from '@/features/auth/model/schemas';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

export async function login(data: LoginInput): Promise<void> {
  const validated = LoginSchema.parse(data);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validated),
    cache: 'no-store',
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Login failed');
  }

  if (json.token) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: json.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  redirect(ROUTES.AUTH.ORGANIZATION);
}

export async function register(data: RegisterInput): Promise<void> {
  const validated = RegisterSchema.parse(data);

  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validated),
    cache: 'no-store',
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || 'Registration failed');
  }

  if (json.token) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'token',
      value: json.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  if (json.organization_id) {
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'organization_id',
      value: json.organization_id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  redirect(ROUTES.AUTH.ORGANIZATION);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('organization_id');

  redirect(ROUTES.AUTH.LOGIN);
}

export async function logout(): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const cookieStore = await cookies();

  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (res.ok) {
    cookieStore.delete('token');
    cookieStore.delete('organization_id');

    redirect(ROUTES.AUTH.LOGIN);
  }
}
