import { getPersons, IssuesLayoutClient } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import Card from '@/shared/ui/card/Card';

import type { ReactNode } from 'react';

/**
 * IssuesLayout — shared layout for the issues/kanban sub-routes.
 * Fetches organizations and persons once server-side.
 * Filter state is initialized client-side from URL search params.
 */
export default async function IssuesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [organizationsResponse, persons, currentUserId] = await Promise.all([
    getOrganizations(),
    getPersons(),
    getCurrentUserId(),
  ]);

  return (
    <Card>
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
