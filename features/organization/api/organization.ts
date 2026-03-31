'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type {
  OrganizationDTO,
  OrganizationProps,
  OrganizationUpdateDTO,
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
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) {
        redirect('/api/auth/clear-session');
      }

      const text = await res.text();

      // eslint-disable-next-line no-console
      console.error(
        `[org] getOrganizations → ${res.status} ${res.statusText}: ${text}`,
      );
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
      console.error(
        `[org] getOrganization → ${res.status} ${res.statusText}: ${text}`,
      );
      throw new Error('Failed to load organization. Please try again.');
    }

    const json: ApiResponse<OrganizationProps> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

/**
 * createOrganization.
 * @param data - data.
 * @returns Promise.
 */
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
    console.error(
      `[org] createOrganization → ${res.status} ${res.statusText}: ${text}`,
    );
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

/**
 * updateOrganization.
 * @param organizationId - organization id.
 * @param data - data.
 * @returns Promise.
 */
export async function updateOrganization(
  organizationId: number,
  data: OrganizationUpdateDTO,
) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/organizations/${organizationId}`, {
    method: 'PUT',
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
    console.error(
      `[org] updateOrganization → ${res.status} ${res.statusText}: ${text}`,
    );
    throw new Error('Failed to update organization. Please try again.');
  }

  const json: ApiResponse<OrganizationProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
}

/**
 * setActiveOrganization.
 * @param prevState
 * @param prevState.ok
 * @param formData
 * @returns Promise.
 */
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

  revalidatePath(ROUTES.DASHBOARD.ORGANIZATION);

  return { ok: true };
}

/**
 * selectOrganizationAction.
 * @param formData - formData.
 * @returns Promise.
 */
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

  redirect(ROUTES.DASHBOARD.MAIN);
}
