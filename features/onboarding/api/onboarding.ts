'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClient } from '@/shared/lib/httpClient';

import type {
  AcceptStructurePayload,
  AcceptStructureResponse,
  GenerateStructurePayload,
} from '../model/types';
import type { ActionResult } from '@/shared/types/server-action';

export async function generateStructure(
  orgId: number,
  payload: GenerateStructurePayload,
): Promise<ActionResult<{ draft_id: number; status: 'pending' }>> {
  try {
    const { data } = await httpClient<{ draft_id: number; status: 'pending' }>(
      `${API_URL}/organizations/${orgId}/generate-structure`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!data) return { data: null, error: 'Failed to start generation' };

    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to start generation',
      );

      return { data: null, error: parsed.message };
    }

    throw error;
  }
}

export async function skipOnboarding(
  orgId: number,
  orgName: string,
  orgDescription: string,
): Promise<ActionResult<AcceptStructureResponse>> {
  const payload: AcceptStructurePayload = {
    organization: {
      name: orgName,
      description:
        orgDescription || 'Organization set up during onboarding skip.',
    },
    goals: [
      {
        title: 'Getting started',
      },
    ],
    team: [],
  };

  return acceptStructure(orgId, payload);
}

export async function acceptStructure(
  orgId: number,
  payload: AcceptStructurePayload,
): Promise<ActionResult<AcceptStructureResponse>> {
  try {
    const { data } = await httpClient<AcceptStructureResponse>(
      `${API_URL}/organizations/${orgId}/accept-structure`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!data) return { data: null, error: 'Failed to save organization' };

    const store = await cookies();

    store.set({
      name: 'org_onboarded',
      value: '1',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath('/dashboard', 'layout');

    return { data, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to save organization',
      );

      return { data: null, error: parsed.message };
    }

    throw error;
  }
}
