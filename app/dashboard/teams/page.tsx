import { cookies } from 'next/headers';
import React from 'react';

import { getTeams } from '@/app/actions/team';
import TeamCreate from '@/features/teams/ui/team-create';
import { TeamList } from '@/features/teams/ui/team-list';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import ComponentHeader from '@/shared/ui/layout/component-header';
import { H2 } from '@/shared/ui/typography/H2';

export default async function Page() {
  const cookieStore = await cookies();
  const organization_id = cookieStore.get('organization_id')?.value;

  if (!organization_id) return null;

  const { data: teams = [] } = await getTeams(organization_id);

  return (
    <Card className='h-full flex flex-col'>
      <ComponentHeader>
        <H2>Teams</H2>
      </ComponentHeader>

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
