'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';

import type {
  OrganizationDTO,
  OrganizationProps,
} from '@/entities/organization';
import type { ApiResponse } from '@/shared/types/common';

export const getOrganizations = cache(
  async (): Promise<ApiResponse<OrganizationProps[]>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/organizations?limit=50&offset=0`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-console
      console.error(`[org] getOrganizations → ${res.status} ${res.statusText}: ${text}`);
      throw new Error('Failed to load organizations. Please try again.');
    }

    const json: ApiResponse<OrganizationProps[]> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);
export const getOrganization = cache(
  async (organization_id: string): Promise<ApiResponse<OrganizationProps>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/organizations/${organization_id}`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-console
      console.error(`[org] getOrganization → ${res.status} ${res.statusText}: ${text}`);
      throw new Error('Failed to load organization. Please try again.');
    }

    const json: ApiResponse<OrganizationProps> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

export async function createOrganization(data: OrganizationDTO) {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/organizations`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    // eslint-disable-next-line no-console
    console.error(`[org] createOrganization → ${res.status} ${res.statusText}: ${text}`);
    throw new Error('Failed to create organization. Please try again.');
  }

  const json: ApiResponse<OrganizationProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const formData = new FormData();
  formData.append('organization_id', String(json.data.id));

  await selectOrganizationAction(formData);
  revalidatePath('/organizations');
}

export async function setActiveOrganization(
  prevState: { ok: boolean },
  formData: FormData,
) {
  const id = formData.get('organization_id') as string;

  const store = await cookies();

  store.set({
    name: 'organization_id',
    value: id,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  revalidatePath('/dashboard/organization');

  return { ok: true };
}

export async function selectOrganizationAction(formData: FormData) {
  const id = formData.get('organization_id') as string;

  const store = await cookies();

  store.set({
    name: 'organization_id',
    value: id,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/dashboard/calendar');
}
