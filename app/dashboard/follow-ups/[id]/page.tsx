import React from 'react';

import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Follow ups'} />

      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>Soon</CardBody>
      </div>
    </Card>
  );
}
