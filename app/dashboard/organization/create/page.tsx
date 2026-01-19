import React from 'react';

import { getOrganization } from '@/app/actions/organization';
import OrganizationForm from '@/features/organization/ui/organization-form';
import ButtonBack from '@/shared/ui/button/button-back';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import ComponentHeader from '@/shared/ui/layout/component-header';
import { H2 } from '@/shared/ui/typography/H2';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  return (
    <Card className={'h-full flex flex-col'}>
      <ComponentHeader>
        <ButtonBack /> <H2>Organization create</H2>
      </ComponentHeader>
      <CardBody>
        <OrganizationForm />
      </CardBody>
    </Card>
  );
}
