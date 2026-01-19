'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type {
  MethodologyDTO,
  MethodologyProps,
} from '@/features/methodology/model/types';
import type { ApiResponse } from '@/shared/types/common';

export async function createMethodology(
  id: number | undefined,
  data: MethodologyDTO,
): Promise<MethodologyProps> {
  const authHeaders = await getAuthHeaders();

  const payload = {
    organization_id: id,
    ...data,
  };

  const res = await fetch(`${API_URL}/methodologies`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `createOrganization failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const json: ApiResponse<MethodologyProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error);
  }

  revalidatePath('METHODOLOGY');
  redirect(ROUTES.DASHBOARD.METHODOLOGY);
}

export async function updateMethodology(
  id: number | undefined,
  data: MethodologyDTO,
): Promise<MethodologyProps> {
  const authHeaders = await getAuthHeaders();

  const payload = {
    organization_id: id,
    ...data,
  };

  const res = await fetch(`${API_URL}/methodologies/${id}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `updateMethodology failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const json: ApiResponse<MethodologyProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  revalidatePath('METHODOLOGY');
  redirect(ROUTES.DASHBOARD.METHODOLOGY);
}

export const getMethodologies = cache(
  async (organization_id: string): Promise<ApiResponse<MethodologyProps[]>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(
      `${API_URL}/organizations/${organization_id}/methodologies`,
      {
        method: 'GET',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `getMethodologies failed: ${res.status} ${res.statusText} — ${text}`,
      );
    }

    const json: ApiResponse<MethodologyProps[]> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

export const getMethodology = cache(
  async (methodology_id: string): Promise<ApiResponse<MethodologyProps>> => {
    const authHeaders = await getAuthHeaders();

    const res = await fetch(`${API_URL}/methodologies/${methodology_id}`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `getMethodologies failed: ${res.status} ${res.statusText} — ${text}`,
      );
    }

    const json: ApiResponse<MethodologyProps> = await res.json();

    if (!json.success || !json.data) {
      throw new Error(json.error ?? 'Invalid API response');
    }

    return { data: json.data };
  },
);

export async function deleteMethodology(id: string): Promise<MethodologyProps> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/methodologies/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `deleteMethodology failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }

  const json: ApiResponse<MethodologyProps> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }
  revalidatePath('METHODOLOGY');

  return json.data;
}
