import { getPersons } from '@/features/issues';
import { IssuesLayoutClient } from '@/features/issues/ui/issues-layout-client';
import { getOrganizations } from '@/features/organization/api/organization';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * IssuesLayout — shared layout for the issues/kanban sub-routes.
 * Fetches organizations and persons once server-side.
 * Filter state is initialized client-side from URL search params.
 */
export default async function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizationsResponse, persons] = await Promise.all([
    getOrganizations(),
    getPersons(),
  ]);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Tasktracker' />
      <div className='flex-1 overflow-hidden'>
        <IssuesLayoutClient
          organizations={organizationsResponse.data ?? []}
          persons={persons}
        >
          {children}
        </IssuesLayoutClient>
      </div>
    </Card>
  );
}
