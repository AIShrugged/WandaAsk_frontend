import { cookies } from 'next/headers';
import React from 'react';

import { getMethodologies } from '@/app/actions/methodology';
import MethodologyCreate from '@/features/methodology/ui/methodology-create';
import MethodologyList from '@/features/methodology/ui/methodology-list';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const cookieStore = await cookies();
  const id = cookieStore.get('organization_id')?.value;

  if (!id) return;

  const { data: methodologies } = await getMethodologies(id);

  if (!methodologies) return null;

  console.log('methodologies', methodologies);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Methodologies'}></PageHeader>

      <CardBody>
        <MethodologyList methodologies={methodologies} />
        <MethodologyCreate />
      </CardBody>
    </Card>
  );
}
