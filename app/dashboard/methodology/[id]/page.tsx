import { cookies } from 'next/headers';
import React from 'react';

import { getMethodology } from '@/app/actions/methodology';
import MethodologyForm from '@/features/methodology/ui/methodology-form';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const organization_id = cookieStore.get('organization_id')?.value;

  const { data: methodology } = await getMethodology(id);

  if (!organization_id) return;

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={methodology?.name || ''}></PageHeader>

      <CardBody>
        <MethodologyForm
          organization_id={+organization_id}
          values={methodology}
        />
      </CardBody>
    </Card>
  );
}
