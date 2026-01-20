'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { API_URL } from '@/app/constants/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { httpClient } from '@/shared/lib/httpClient';
import { ROUTES } from '@/shared/lib/routes';

import type { OrganizationProps } from '@/features/organization/model/types';
import type {
  TeamAddMemberDTO,
  TeamCreateDTO,
  TeamProps,
} from '@/features/teams/model/types';
import type { ApiResponse } from '@/shared/types/common';

// ------------------------------
// Teams API
// ------------------------------
export const getTeams = async (organizationId: number | string) => {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_URL}/organizations/${organizationId}/teams`, {
    headers: {
      ...authHeaders,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${text}`);
  }

  const json: ApiResponse<TeamProps[]> = await res.json();

  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'Invalid API response');
  }

  return { data: json.data };
};

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
  await httpClient<TeamProps>(`${API_URL}/teams`, {
    method: 'POST',
    body: JSON.stringify({
      organization_id: organizationId,
      ...data,
    }),
  });

  revalidatePath('/team');
  redirect(ROUTES.DASHBOARD.TEAMS);
}

export async function updateTeam(id: number, data: TeamCreateDTO) {
  await httpClient<TeamProps>(`${API_URL}/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  revalidatePath('/team');
  redirect(ROUTES.DASHBOARD.TEAMS);
}

// ------------------------------
// Invite member
// ------------------------------
export async function createInviteTeamMember(data: TeamAddMemberDTO) {
  await httpClient<OrganizationProps>(`${API_URL}/teams/invite`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  revalidatePath('/team');
}
