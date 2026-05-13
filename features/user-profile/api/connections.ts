'use server';

import { revalidatePath } from 'next/cache';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';
import { ROUTES } from '@/shared/lib/routes';

import type { UserIdentityProps, TelegramLinkData } from '../model/types';
import type { ActionResult } from '@/shared/types/server-action';

export async function getIdentities(): Promise<UserIdentityProps[]> {
  const { data } = await httpClient<UserIdentityProps[]>(
    `${API_URL}/users/me/identities`,
  );
  return data ?? [];
}

export async function generateTelegramLink(): Promise<
  ActionResult<TelegramLinkData>
> {
  try {
    const { data } = await httpClient<TelegramLinkData>(
      `${API_URL}/telegram/link`,
      { method: 'POST' },
    );
    return { data: data as TelegramLinkData, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to generate Telegram link',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}

export async function unlinkIdentity(profileId: number): Promise<ActionResult> {
  try {
    await httpClient(`${API_URL}/users/me/identities/${profileId}`, {
      method: 'DELETE',
    });
    revalidatePath(ROUTES.DASHBOARD.PROFILE_CONNECTIONS);
    return { data: undefined, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to unlink identity',
      );
      return { data: null, error: parsed.message };
    }
    throw error;
  }
}
