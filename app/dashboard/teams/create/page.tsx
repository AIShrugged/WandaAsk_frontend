import React from 'react';

import { TEAM_CREATE_VALUES } from '@/features/teams/model/fields';
import TeamCreateForm from '@/features/teams/ui/team-create-form';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { TeamProps } from '@/features/teams/model/types';

export default async function Page() {
  const organizationId = await getOrganizationId();

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Team'}></PageHeader>

      <CardBody>
        <TeamCreateForm
          organization_id={organizationId}
          values={TEAM_CREATE_VALUES as TeamProps}
        />
      </CardBody>
    </Card>
  );
}
