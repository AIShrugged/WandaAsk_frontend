'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { httpClient } from '@/shared/lib/httpClient';

import type {
  TeamAddMemberDTO,
  TeamCreateDTO,
  TeamFollowUpDTO,
  TeamProps,
} from '@/entities/team';
import type { FollowUpDetailProps } from '@/features/follow-up/model/types';
import type { ApiResponse } from '@/shared/types/common';

// ------------------------------
// Teams API
// ------------------------------
/**
 * getTeams.
 * @param organizationId - organizationId.
 * @returns Promise.
 */
export const getTeams = async (organizationId: number | string) => {
  const { data, totalCount } = await loadTeamsChunk(organizationId, 0, 10);

  return { data, totalCount };
};

/**
 * loadTeamsChunk.
 * @param organizationId
 * @param offset
 * @param limit
 * @returns Promise.
 */
export async function loadTeamsChunk(
  organizationId: number | string,
  offset: number,
  limit: number,
) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/organizations/${organizationId}/teams?offset=${offset}&limit=${limit}`,
    {
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const text = await res.text();

    throw new Error(`${text}`);
  }

  const json: ApiResponse<TeamProps[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  const totalCount = Number(res.headers.get('Items-Count') || '0');

  return { data: json.data, totalCount, hasMore: offset + limit < totalCount };
}

/**
 * getTeam.
 * @param teamId - teamId.
 * @returns Promise.
 */
export const getTeam = async (teamId: string) => {
  return httpClient<TeamProps>(`${API_URL}/teams/${teamId}`);
};

/**
 * deleteTeam.
 * @param teamId - teamId.
 * @returns Promise.
 */
export async function deleteTeam(teamId: number) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/teams/${teamId}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return await res.text();
  }
  revalidatePath('/teams');
}

// ------------------------------
// Create / Update
// ------------------------------
/**
 * createTeam.
 * @param organizationId - organizationId.
 * @param data - data.
 * @returns Promise.
 */
export async function createTeam(organizationId: string, data: TeamCreateDTO) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/teams`, {
    method: 'POST',
    headers: {
      ...authHeaders,
    },
    body: JSON.stringify({
      organization_id: organizationId,
      ...data,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    return { error: text || 'Failed to create team' };
  }

  revalidatePath('/team');

  return { error: null };
}

/**
 * updateTeam.
 * @param id - id.
 * @param data - data.
 * @returns Promise.
 */
export async function updateTeam(id: number, data: TeamCreateDTO) {
  await httpClient<TeamProps>(`${API_URL}/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  revalidatePath('/team');
}

/**
 * getTeamFollowUps.
 * @param teamId
 * @returns Promise.
 */
export const getTeamFollowUps = async (
  teamId: number | string,
): Promise<{ data: TeamFollowUpDTO[] }> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/teams/${teamId}/followups`, {
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();

    throw new Error(`${text}`);
  }

  const json: ApiResponse<TeamFollowUpDTO[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
};

/**
 * getTeamFollowUp.
 * @param calendarEventId - calendarEventId.
 * @returns Promise.
 */
export const getTeamFollowUp = async (
  calendarEventId: number | string,
): Promise<{ data: FollowUpDetailProps }> => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(
    `${API_URL}/calendar-events/${calendarEventId}/followup`,
    {
      headers: {
        ...authHeaders,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const text = await res.text();

    throw new Error(`${text}`);
  }

  const json = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
};

/**
 * sendInvite.
 * @param teamId - teamId.
 * @param data - data.
 * @returns Promise.
 */
export const sendInvite = async (teamId: number, data: TeamAddMemberDTO) => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}/teams/${teamId}/invites`, {
    method: 'POST',
    headers: {
      ...authHeaders,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message ?? 'Failed to send invite');
  }

  return { data: json.data, message: json.message as string };
};
