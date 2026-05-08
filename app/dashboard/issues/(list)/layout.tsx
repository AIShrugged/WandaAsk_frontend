import { getPersons, IssuesLayoutClient } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import Card from '@/shared/ui/card/Card';

import type { PropsWithChildren } from 'react';

export default async function IssuesLayout({ children }: PropsWithChildren) {
  const [organizationsResponse, persons, currentUserId] = await Promise.all([
    getOrganizations(),
    getPersons(),
    getCurrentUserId(),
  ]);

  return (
    <Card className='overflow-hidden'>
      <IssuesLayoutClient
        organizations={organizationsResponse.data ?? []}
        persons={persons}
        currentUserId={currentUserId ?? null}
      >
        {children}
      </IssuesLayoutClient>
    </Card>
  );
}
