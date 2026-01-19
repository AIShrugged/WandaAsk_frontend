import React from 'react';

import { getOrganization } from '@/app/actions/organization';
import OrganizationForm from '@/features/organization/ui/organization-form';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { data: organization } = await getOrganization(id);

  if (!organization) return null;

  return (
    <Card className={'h-full flex flex-col'}>
      <PageHeader hasButtonBack title={'Organization settings'} />
      <CardBody>
        <OrganizationForm values={organization} />
      </CardBody>
    </Card>
  );
}
