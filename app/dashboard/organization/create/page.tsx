import React from 'react';

import { OrganizationForm } from '@/features/organization';
import { Card, CardBody } from '@/shared/ui/card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Page component.
 */
export default async function Page() {
  return (
    <Card className={'h-full flex flex-col'}>
      <PageHeader hasButtonBack title={'Organization create'} />

      <CardBody>
        <OrganizationForm />
      </CardBody>
    </Card>
  );
}
