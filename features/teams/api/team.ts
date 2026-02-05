'use server';

import { revalidatePath } from 'next/cache';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { httpClient } from '@/shared/lib/httpClient';

import type { OrganizationProps } from '@/features/organization/model/types';
import type {
  TeamAddMemberDTO,
  TeamCreateDTO,
  TeamFollowUpDTO,
  TeamProps,
} from '@/features/teams/model/types';
import type { ApiResponse } from '@/shared/types/common';

// ------------------------------
// Teams API
// ------------------------------
export const getTeams = async (organizationId: number | string) => {
  const { data, totalCount } = await loadTeamsChunk(organizationId, 0, 10);
  return { data, totalCount };
};

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

export const getTeam = async (teamId: string) =>
  httpClient<TeamProps>(`${API_URL}/teams/${teamId}`);

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

export async function updateTeam(id: number, data: TeamCreateDTO) {
  await httpClient<TeamProps>(`${API_URL}/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  revalidatePath('/team');
}

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

export const getTeamFollowUp = async (calendarEventId: number | string) => {
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
