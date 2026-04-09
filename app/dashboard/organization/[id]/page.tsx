import React from 'react';

import { getAgentProfiles } from '@/features/agents/api/agents';
import { getOrganization } from '@/features/organization/api/organization';
import { OrganizationDangerZone } from '@/features/organization/ui/organization-danger-zone';
import OrganizationForm from '@/features/organization/ui/organization-form';
import { OrganizationIssueTypesSettings } from '@/features/organization/ui/organization-issue-types-settings';
import { OrganizationSettingsTabs } from '@/features/organization/ui/organization-settings-tabs';
import { ServerError } from '@/shared/lib/errors';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentProfile } from '@/features/agents/model/types';
import type { PageProps } from '@/shared/types/common';

/**
 * Page component.
 * @param props - Component props.
 * @param props.params
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { data: organization } = await getOrganization(id);
  let agentProfiles: AgentProfile[] = [];

  try {
    const { data } = await getAgentProfiles();
    agentProfiles = data;
  } catch (error) {
    if (error instanceof ServerError && error.status === 403) {
      agentProfiles = [];
    } else {
      throw error;
    }
  }

  if (!organization) return null;

  return (
    <Card className={'h-full flex flex-col'}>
      <PageHeader hasButtonBack title={'Organization settings'} />
      <CardBody>
        <OrganizationSettingsTabs
          generalContent={
            <div className='flex flex-col gap-8'>
              <OrganizationForm values={organization} />
              <OrganizationDangerZone org={organization} />
            </div>
          }
          taskTypesContent={
            <OrganizationIssueTypesSettings
              organizationId={organization.id}
              issueTypes={organization.issue_types}
              profiles={agentProfiles}
            />
          }
        />
      </CardBody>
    </Card>
  );
}
