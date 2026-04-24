'use server';

import { revalidatePath } from 'next/cache';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type { UserFocus } from '../types';
import type { ActionResult } from '@/shared/types/server-action';

export async function getUserFocus(): Promise<UserFocus | null> {
  const { data } = await httpClient<UserFocus>(`${API_URL}/me/focus`);
  return data ?? null;
}

export async function setUserFocus(payload: {
  focus_text: string;
  deadline?: string | null;
}): Promise<ActionResult<void>> {
  try {
    await httpClient(`${API_URL}/me/focus`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    revalidatePath('/dashboard/today');
    return { data: undefined, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to save focus',
      );
      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }
    throw error;
  }
}

export async function clearUserFocus(): Promise<ActionResult<void>> {
  try {
    await httpClient(`${API_URL}/me/focus`, { method: 'DELETE' });
    revalidatePath('/dashboard/today');
    return { data: undefined, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to clear focus',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
