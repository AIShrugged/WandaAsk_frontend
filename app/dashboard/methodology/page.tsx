import React from 'react';

import { getMethodologies } from '@/app/actions/methodology';
import MethodologyCreate from '@/features/methodology/ui/methodology-create';
import MethodologyList from '@/features/methodology/ui/methodology-list';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const organizationId = await getOrganizationId();
  const { data: methodologies } = await getMethodologies(organizationId);

  if (!methodologies) return null;

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
