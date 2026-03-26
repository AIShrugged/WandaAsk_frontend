import React from 'react';

import { getMethodology } from '@/features/methodology/api/methodology';
import MethodologyForm from '@/features/methodology/ui/methodology-form';
import { getTeams } from '@/features/teams/api/team';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

/**
 * Page component.
 * @param props - Component props.
 * @param props.params
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const organizationId = await getOrganizationId();
  const { data: methodology } = await getMethodology(id);
  const { data: teams } = await getTeams(organizationId);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={methodology?.name || ''}></PageHeader>

      <CardBody>
        <MethodologyForm
          organization_id={organizationId}
          teams={teams ?? []}
          values={methodology}
        />
      </CardBody>
    </Card>
  );
}
