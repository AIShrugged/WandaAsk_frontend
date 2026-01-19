import { cookies } from 'next/headers';
import React from 'react';

import MethodologyForm from '@/features/methodology/ui/methodology-form';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const cookieStore = await cookies();
  const organization_id = cookieStore.get('organization_id')?.value;

  if (!organization_id) return;

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Methodologies'}></PageHeader>

      <CardBody>
        <MethodologyForm organization_id={+organization_id} />
      </CardBody>
    </Card>
  );
}
