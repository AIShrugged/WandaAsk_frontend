import { Suspense } from 'react';

import { getPersons, IssuesLayoutClient } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { Card } from '@/shared/ui/card';

import type { PropsWithChildren } from 'react';

export default async function IssuesTabsLayout({
  children,
}: PropsWithChildren) {
  const [organizationsResponse, persons, currentUserId, cookieOrgId] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getOrganizationId(),
    ]);

  return (
    <Card className='overflow-hidden'>
      <Suspense>
        <IssuesLayoutClient
          organizations={organizationsResponse.data ?? []}
          persons={persons}
          currentUserId={currentUserId ?? null}
          cookieOrgId={cookieOrgId}
        >
          {children}
        </IssuesLayoutClient>
      </Suspense>
    </Card>
  );
}
