'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { API_URL } from '@/shared/lib/config';
import { httpClient } from '@/shared/lib/httpClient';

import type { Theme, UserPreferences } from '@/entities/user';
import type { ActionResult } from '@/shared/types/server-action';

export async function updateUserPreferences(
  current: UserPreferences,
  delta: Partial<UserPreferences>,
): Promise<ActionResult> {
  const merged: UserPreferences = { ...current, ...delta };
  try {
    await httpClient<void>(`${API_URL}/users/me/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
    revalidatePath('/dashboard', 'layout');
    return { data: undefined, error: null };
  } catch {
    return {
      data: null,
      error: 'Failed to save preferences. Please try again.',
    };
  }
}

export async function updateThemePreference(
  current: UserPreferences,
  theme: Theme,
): Promise<ActionResult> {
  const cookieStore = await cookies();
  cookieStore.set('wanda-theme', theme, {
    path: '/',
    sameSite: 'lax',
    maxAge: 31_536_000,
  });
  return updateUserPreferences(current, { theme });
}
