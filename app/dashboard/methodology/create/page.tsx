import React from 'react';

import MethodologyForm from '@/features/methodology/ui/methodology-form';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function Page() {
  const organizationId = await getOrganizationId();

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={'Methodologies'}></PageHeader>

      <CardBody>
        <MethodologyForm organization_id={+organizationId} />
      </CardBody>
    </Card>
  );
}
