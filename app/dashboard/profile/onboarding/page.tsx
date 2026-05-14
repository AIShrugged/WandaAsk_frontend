import { redirect } from 'next/navigation';

import { OnboardingWizard, getLatestDraft } from '@/features/onboarding';
import { getOrganization } from '@/features/organization/api/organization';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { ROUTES } from '@/shared/lib/routes';

export const metadata = { title: 'Onboarding' };

export default async function ProfileOnboardingPage() {
  const orgId = await getOrganizationId();
  const [{ data: org }, initialDraft] = await Promise.all([
    getOrganization(orgId),
    getLatestDraft(orgId),
  ]);

  if (!org) {
    redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
  }

  if (org.onboarded_at) {
    redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
  }

  return (
    <OnboardingWizard
      orgId={org.id}
      orgName={org.name}
      initialDraft={initialDraft}
      redirectAfterSkip={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
      redirectAfterAccept={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
    />
  );
}
