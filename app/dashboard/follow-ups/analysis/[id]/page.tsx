import React from 'react';

import { getTeamFollowUp } from '@/app/actions/team';
import Analysis from '@/features/analysis/ui/analysis';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { data: followUp } = await getTeamFollowUp(id);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Follow ups'} />

      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          <Analysis data={followUp.text} />
        </CardBody>
      </div>
    </Card>
  );
}
