'use server';

import { revalidatePath } from 'next/cache';

import { parseApiError } from '@/shared/lib/apiError';
import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { httpClient, httpClientList } from '@/shared/lib/httpClient';

import type {
  TeamAddMemberDTO,
  TeamCreateDTO,
  TeamFollowUpDTO,
  TeamInvite,
  TeamProps,
  TeamUserRecord,
} from '@/entities/team';
import type { FollowUpDetailProps } from '@/features/follow-up/model/types';
import type { ApiResponse } from '@/shared/types/common';
import type { ActionResult } from '@/shared/types/server-action';

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
  revalidatePath('/dashboard/teams');
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
export async function createTeam(
  organizationId: string,
  data: TeamCreateDTO,
): Promise<{ error: string; data: null } | { error: null; data: TeamProps }> {
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

    return { error: text || 'Failed to create team', data: null };
  }

  revalidatePath('/dashboard/teams');

  const json: ApiResponse<TeamProps> = await res.json();

  return { error: null, data: json.data ?? ({ id: 0 } as TeamProps) };
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

  revalidatePath('/dashboard/teams');
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
 * getTeamUsers — list team members as TeamUser pivot records (includes team_user id needed for kick).
 * @param teamId - teamId.
 * @returns Promise.
 */
export const getTeamUsers = async (
  teamId: number | string,
): Promise<TeamUserRecord[]> => {
  const { data } = await httpClient<TeamUserRecord[]>(
    `${API_URL}/teams/${teamId}/users`,
  );

  return data ?? [];
};

/**
 * kickTeamMember — remove a user from a team by their user id.
 * Resolves the TeamUser pivot record internally.
 * @param teamId - team id.
 * @param userId - User.id (from team.members).
 * @returns Promise with ActionResult.
 */
export async function kickTeamMember(
  teamId: number | string,
  userId: number | string,
): Promise<{ error: string | null }> {
  try {
    const teamUsers = await getTeamUsers(teamId);
    const teamUser = teamUsers.find((tu) => {
      return tu.user.id === Number(userId);
    });

    if (!teamUser) {
      return { error: 'Member not found in team' };
    }

    await httpClient(`${API_URL}/teams/${teamId}/users/${teamUser.id}/kick`, {
      method: 'POST',
    });
    revalidatePath('/dashboard/teams');

    return { error: null };
  } catch (error) {
    return {
      error: (error as Error).message ?? 'Failed to remove member',
    };
  }
}

/**
 * sendInvite.
 * @param teamId - teamId.
 * @param data - data.
 * @returns Promise.
 */
export async function sendInvite(
  teamId: number,
  data: TeamAddMemberDTO,
): Promise<ActionResult<{ id: number; email: string; status: string }>> {
  try {
    const { data: invite } = await httpClient<{
      id: number;
      email: string;
      status: string;
    }>(`${API_URL}/teams/${teamId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    revalidatePath('/dashboard/teams');

    return {
      data: invite ?? { id: 0, email: data.email, status: 'pending' },
      error: null,
    };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to send invite',
      );

      return {
        data: null,
        error: parsed.message,
        fieldErrors: parsed.fieldErrors,
      };
    }

    throw error;
  }
}

/**
 * getTeamInvites — list all invitations for a team (manager-only).
 * @param teamId - teamId.
 * @returns Promise with list of TeamInvite.
 */
export async function getTeamInvites(
  teamId: number | string,
): Promise<TeamInvite[]> {
  const { data } = await httpClientList<TeamInvite>(
    `${API_URL}/teams/${teamId}/invites`,
  );

  return data ?? [];
}

/**
 * cancelTeamInvite — cancel a pending invitation.
 * @param teamId - teamId.
 * @param inviteId - inviteId.
 * @returns Promise with ActionResult.
 */
export async function cancelTeamInvite(
  teamId: number | string,
  inviteId: number,
): Promise<ActionResult<void>> {
  try {
    await httpClient(`${API_URL}/teams/${teamId}/invites/${inviteId}`, {
      method: 'DELETE',
    });

    revalidatePath('/dashboard/teams');

    return { data: undefined, error: null };
  } catch (error) {
    if (error instanceof ServerError) {
      const parsed = parseApiError(
        error.responseBody ?? '',
        'Failed to cancel invite',
      );

      return { data: null, error: parsed.message };
    }

    throw error;
  }
}
