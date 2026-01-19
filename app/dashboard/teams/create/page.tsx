import { cookies } from 'next/headers';
import React from 'react';

import { TEAM_CREATE_VALUES } from '@/features/teams/model/fields';
import TeamCreateForm from '@/features/teams/ui/team-create-form';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { TeamProps } from '@/features/teams/model/types';

export default async function Page() {
  const cookieStore = await cookies();
  const organization_id = cookieStore.get('organization_id')?.value;

  if (!organization_id) return;

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Team'}></PageHeader>

      <CardBody>
        <TeamCreateForm
          organization_id={organization_id}
          values={TEAM_CREATE_VALUES as TeamProps}
        />
      </CardBody>
    </Card>
  );
}
