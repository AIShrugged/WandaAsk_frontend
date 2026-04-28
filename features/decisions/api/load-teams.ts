'use server';

import { getOrganizations } from '@/features/organization';
import { getTeams } from '@/features/teams';

import type { TeamProps } from '@/entities/team';

export async function loadDecisionsTeams(): Promise<TeamProps[]> {
  const orgsResponse = await getOrganizations();
  const orgs = orgsResponse.data ?? [];

  const teamResults = await Promise.all(
    orgs.map((org) => {
      return getTeams(org.id).catch(() => {
        return { data: [] as TeamProps[], totalCount: 0 };
      });
    }),
  );

  return teamResults.flatMap((r) => {
    return r.data ?? [];
  });
}
