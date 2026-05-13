import { redirect } from 'next/navigation';

import { OnboardingWizard } from '@/features/onboarding';
import { onboardingDraftResponseSchema } from '@/features/onboarding/model/schemas';
import { getOrganization } from '@/features/organization/api/organization';
import { API_URL } from '@/shared/lib/config';
import { getAuthHeaders } from '@/shared/lib/getAuthToken';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { ROUTES } from '@/shared/lib/routes';

import type { OnboardingDraftResponse } from '@/features/onboarding';

export const metadata = { title: 'Onboarding' };

async function getLatestDraft(
  orgId: string,
): Promise<OnboardingDraftResponse | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/organizations/${orgId}/drafts/latest`, {
      headers,
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const json = await res.json();
    const parsed = onboardingDraftResponseSchema.safeParse(json.data);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export default async function ProfileOnboardingPage() {
  const orgId = await getOrganizationId();
  const [{ data: org }, initialDraft] = await Promise.all([
    getOrganization(orgId),
    getLatestDraft(orgId),
  ]);

  if (org?.onboarded_at) {
    redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
  }

  return (
    <OnboardingWizard
      orgId={org?.id ?? Number(orgId)}
      orgName={org?.name ?? ''}
      orgDescription={org?.context ?? ''}
      initialDraft={initialDraft}
    />
  );
}
