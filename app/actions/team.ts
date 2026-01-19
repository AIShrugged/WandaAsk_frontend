'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { API_URL } from '@/app/constants/config';
import { httpClient } from '@/shared/lib/httpClient';
import { ROUTES } from '@/shared/lib/routes';

import type { OrganizationProps } from '@/features/organization/model/types';
import type {
  TeamAddMemberDTO,
  TeamCreateDTO,
  TeamProps,
} from '@/features/teams/model/types';

// ------------------------------
// Teams API
// ------------------------------
export const getTeams = async (organizationId: number | string) =>
  httpClient<TeamProps[]>(`${API_URL}/organizations/${organizationId}/teams`);

export const getTeam = async (teamId: string) =>
  httpClient<TeamProps>(`${API_URL}/teams/${teamId}`);

export async function deleteTeam(id: number) {
  await httpClient<void>(`${API_URL}/teams/${id}`, {
    method: 'DELETE',
  });

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
