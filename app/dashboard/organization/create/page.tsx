import React from 'react';

import OrganizationForm from '@/features/organization/ui/organization-form';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

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
