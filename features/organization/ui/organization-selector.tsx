import { cookies } from 'next/headers';

import { getOrganizations } from '@/features/organization/api/organization';
import OrganizationDropdown from '@/features/organization/ui/organization-dropdown';

/**
 * OrganizationSelector component.
 */
export default async function OrganizationSelector() {
  const { data: organizations } = await getOrganizations();
  const cookieStore = await cookies();
  const organization_id = cookieStore.get('organization_id')?.value;

  if (!organizations) return null;

  return (
    <OrganizationDropdown
      organizationActiveId={organization_id ? +organization_id : null}
      organizations={organizations}
    />
  );
}
