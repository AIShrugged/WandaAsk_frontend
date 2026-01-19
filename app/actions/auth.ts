'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type { LoginDTO, RegisterDTO } from '@/features/auth/model/types';

export async function login(data: LoginDTO): Promise<void> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
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

export async function register(data: RegisterDTO): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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

  redirect(ROUTES.AUTH.ORGANIZATION);
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
