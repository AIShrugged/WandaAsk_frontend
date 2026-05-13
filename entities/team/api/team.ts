'use server';

import { API_URL } from '@/shared/lib/config';
import { httpClientList } from '@/shared/lib/httpClient';

import type { TeamProps } from '@/entities/team/model/types';

/**
 * getTeams — fetch teams for an organization, used across multiple features.
 * @param organizationId - organization id.
 * @returns teams list with totalCount.
 */
export async function getTeams(organizationId: number | string) {
  const result = await httpClientList<TeamProps>(
    `${API_URL}/organizations/${organizationId}/teams?offset=0&limit=10`,
  );

  return { data: result.data, totalCount: result.totalCount };
}
