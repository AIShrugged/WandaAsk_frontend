import React from 'react';

import { getMethodologies } from '@/features/methodology/api/methodology';
import MethodologyCreate from '@/features/methodology/ui/methodology-create';
import MethodologyList from '@/features/methodology/ui/methodology-list';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Page component.
 */
export default async function Page() {
  const organizationId = await getOrganizationId();

  const { data: methodologies = [], totalCount = 0 } =
    await getMethodologies(organizationId);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title={'Methodologies'} />

      <div className={'h-full overflow-x-hidden overflow-y-scroll'}>
        <CardBody>
          {methodologies.length > 0 ? (
            <MethodologyList
              initialMethodologies={methodologies}
              totalCount={totalCount}
              organizationId={organizationId}
            />
          ) : (
            'No methodologies in this organization'
          )}
        </CardBody>
      </div>
      <MethodologyCreate />
    </Card>
  );
}
