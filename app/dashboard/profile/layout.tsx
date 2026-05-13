import { cookies } from 'next/headers';

import { getOrganization } from '@/features/organization/api/organization';
import { ProfileTabsNav } from '@/features/user-profile';
import { Card } from '@/shared/ui/card';

import type { PropsWithChildren } from 'react';

export default async function ProfileLayout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('organization_id')?.value;

  let showOnboarding = false;

  if (orgId) {
    try {
      const { data: org } = await getOrganization(orgId);
      showOnboarding = !org?.onboarded_at;
    } catch {
      // If org fetch fails, don't show onboarding tab
    }
  }

  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-4'>
        <ProfileTabsNav showOnboarding={showOnboarding} />
      </div>
      <Card className='h-full flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto p-4'>{children}</div>
      </Card>
    </div>
  );
}
