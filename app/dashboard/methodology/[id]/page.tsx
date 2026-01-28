import React from 'react';

import { getMethodology } from '@/app/actions/methodology';
import MethodologyForm from '@/features/methodology/ui/methodology-form';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const organizationId = await getOrganizationId();
  const { data: methodology } = await getMethodology(id);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={methodology?.name || ''}></PageHeader>

      <CardBody>
        <MethodologyForm
          organization_id={+organizationId}
          values={methodology}
        />
      </CardBody>
    </Card>
  );
}
