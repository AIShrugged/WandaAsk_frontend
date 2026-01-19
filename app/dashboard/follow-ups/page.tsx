import React from 'react';

import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default function Page() {
  return (
    <Card className='min-h-full h-full overflow-x-hidden overflow-y-scroll'>
      <PageHeader title={'Follow ups'} />

      <CardBody>Follow ups</CardBody>
    </Card>
  );
}
