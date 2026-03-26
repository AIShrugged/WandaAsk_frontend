import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Gets organization_id from cookies.
 * Redirects to login page if not found.
 */
export async function getOrganizationId(): Promise<string> {
  const cookieStore = await cookies();
  const organizationId = cookieStore.get('organization_id')?.value;

  if (!organizationId) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return organizationId;
}
