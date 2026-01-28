import React from 'react';

import { getTeams } from '@/app/actions/team';
import TeamCreate from '@/features/teams/ui/team-create';
import { TeamList } from '@/features/teams/ui/team-list';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const organizationId = await getOrganizationId();
  const { data: teams = [] } = await getTeams(organizationId);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Teams'} />

      <CardBody>
        {teams.length > 0 ? (
          <TeamList teams={teams} />
        ) : (
          'No team in this organization'
        )}

        <TeamCreate />
      </CardBody>
    </Card>
  );
}
