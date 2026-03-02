import React from 'react';

import { FollowUpList } from '@/features/follow-up/ui/follow-up-list';
import { getTeamFollowUps } from '@/features/teams/api/team';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const { data: followUps } = await getTeamFollowUps(id);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Follow ups'} />

      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          <FollowUpList followUps={followUps} />
        </CardBody>
      </div>
    </Card>
  );
}
