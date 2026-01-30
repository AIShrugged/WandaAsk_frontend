import React from 'react';

import { getTeamFollowUps } from '@/app/actions/team';
import { FollowUpList } from '@/features/follow-up/ui/follow-up-list';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const organizationId = await getOrganizationId();
  const { data: followUps } = await getTeamFollowUps(organizationId);

  console.log('followUps', followUps);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Follow ups'} />

      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          {followUps.length > 0 ? (
            <FollowUpList followUps={followUps} />
          ) : (
            'No follow ups in this organization'
          )}
        </CardBody>
      </div>
    </Card>
  );
}
