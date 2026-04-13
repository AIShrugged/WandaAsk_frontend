import { getPersons } from '@/features/issues';
import IssueCreateButton from '@/features/issues/ui/issue-create-button';
import { IssuesLayoutClient } from '@/features/issues/ui/issues-layout-client';
import { getOrganizations } from '@/features/organization/api/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

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
    <Card className='h-full flex flex-col'>
      <PageHeader title='Tasks' extraContent={<IssueCreateButton />} />
      <div className='flex-1 overflow-hidden'>
        <IssuesLayoutClient
          organizations={organizationsResponse.data ?? []}
          persons={persons}
          currentUserId={currentUserId ?? null}
        >
          {children}
        </IssuesLayoutClient>
      </div>
    </Card>
  );
}
