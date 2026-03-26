import React from 'react';

import { getTeams } from '@/features/teams/api/team';
import TeamCreate from '@/features/teams/ui/team-create';
import { TeamList } from '@/features/teams/ui/team-list';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Page component.
 */
export default async function Page() {
  const organizationId = await getOrganizationId();
  const { data: teams = [], totalCount = 0 } = await getTeams(organizationId);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Teams'} />

      <div className={'h-full overflow-x-hidden overflow-y-scroll'}>
        <CardBody>
          {teams.length > 0 ? (
            <TeamList
              href={ROUTES.DASHBOARD.TEAMS}
              initialTeams={teams}
              totalCount={totalCount}
              organizationId={organizationId}
              actions={['add-member', 'delete']}
            />
          ) : (
            'No team in this organization'
          )}
        </CardBody>
      </div>
      <TeamCreate />
    </Card>
  );
}
