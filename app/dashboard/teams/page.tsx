import { redirect } from 'next/navigation';
import React from 'react';

import { getTeams } from '@/features/teams/api/team';
import TeamCreate from '@/features/teams/ui/team-create';
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
  const { data: teams = [] } = await getTeams(organizationId);

  if (teams.length > 0) {
    redirect(ROUTES.DASHBOARD.TEAM(teams[0].id));
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Teams'} />

      <div className={'h-full overflow-x-hidden overflow-y-scroll'}>
        <CardBody>No team in this organization</CardBody>
      </div>
      <TeamCreate />
    </Card>
  );
}
