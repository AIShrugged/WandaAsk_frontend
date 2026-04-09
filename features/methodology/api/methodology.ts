'use server';

import { revalidatePath } from 'next/cache';
import { cache } from 'react';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { ROUTES } from '@/shared/lib/routes';

import type {
  MethodologyDTO,
  MethodologyProps,
} from '@/features/methodology/model/types';
import type { ApiResponse } from '@/shared/types/common';

/**
 * afterMethodologyMutate.
 */
const afterMethodologyMutate = () => {
  revalidatePath(ROUTES.DASHBOARD.METHODOLOGY);
};

/**
 * createMethodology.
 * @param data - data.
 * @returns Promise.
 */
export async function createMethodology(data: MethodologyDTO): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const payload = {
    ...data,
    organization_id: Number(data.organization_id),
    teams_ids: data.team_ids.map(Number),
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

  revalidatePath(ROUTES.DASHBOARD.METHODOLOGY);
}

/**
 * updateMethodology.
 * @param methodology_id
 * @param data
 * @returns Promise.
 */
export async function updateMethodology(
  methodology_id: number,
  data: MethodologyDTO,
): Promise<void> {
  const authHeaders = await getAuthHeaders();
  const payload = {
    ...data,
    organization_id: Number(data.organization_id),
    teams_ids: data.team_ids.map(Number),
  };
  const res = await fetch(`${API_URL}/methodologies/${methodology_id}`, {
    method: 'PUT',
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

  afterMethodologyMutate();
}

/**
 * loadMethodologiesChunk.
 * @param organizationId
 * @param offset
 * @param limit
 * @returns Promise.
 */
export async function loadMethodologiesChunk(
  organizationId: string,
  offset: number,
  limit: number,
) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/organizations/${organizationId}/methodologies?offset=${offset}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return { data: json.data, totalCount, hasMore: offset + limit < totalCount };
}

/**
 * getMethodologies.
 * @param organizationId - organizationId.
 * @returns Promise.
 */
export const getMethodologies = async (organizationId: string) => {
  const { data, totalCount } = await loadMethodologiesChunk(
    organizationId,
    0,
    10,
  );

  return { data, totalCount };
};

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

/**
 * deleteMethodology.
 * @param id - id.
 * @returns Promise.
 */
export async function deleteMethodology(id: number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/methodologies/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  afterMethodologyMutate();

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      `deleteMethodology failed: ${res.status} ${res.statusText} — ${text}`,
    );
  }
}
