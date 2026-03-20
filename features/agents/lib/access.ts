import { cookies } from 'next/headers';

import { getOrganizations } from '@/features/organization/api/organization';

import type { OrganizationProps } from '@/entities/organization';

/**
 *
 * @param role
 */
export function isOrganizationManager(role: string | null | undefined) {
  return role?.trim().toLowerCase() === 'manager';
}

/**
 *
 */
export async function getAgentAccessContext(): Promise<{
  organizations: OrganizationProps[];
  managerOrganizations: OrganizationProps[];
  activeOrganization: OrganizationProps | null;
  activeOrganizationId: string;
  canManageAgents: boolean;
}> {
  const [organizationsResponse, cookieStore] = await Promise.all([
    getOrganizations(),
    cookies(),
  ]);

  const organizations = organizationsResponse.data ?? [];

  const activeOrganizationId = cookieStore.get('organization_id')?.value ?? '';

  const activeOrganization =
    organizations.find((organization) => {
      return String(organization.id) === activeOrganizationId;
    }) ?? null;

  const managerOrganizations = organizations.filter((organization) => {
    return isOrganizationManager(organization.pivot.role);
  });

  return {
    organizations,
    managerOrganizations,
    activeOrganization,
    activeOrganizationId,
    canManageAgents: isOrganizationManager(activeOrganization?.pivot.role),
  };
}
