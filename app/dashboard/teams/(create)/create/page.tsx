import { TEAM_CREATE_VALUES } from '@/features/teams/model/fields';
import TeamCreateForm from '@/features/teams/ui/team-create-form';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { TeamProps } from '@/entities/team';

/**
 * Team creation page — dedicated route for creating a new team.
 */
export default async function Page() {
  const organizationId = await getOrganizationId();

  return (
    <Card className='min-h-full flex flex-col'>
      <PageHeader title='New Team' hasButtonBack />
      <div className='px-6 py-6 flex flex-col flex-1'>
        <TeamCreateForm
          organization_id={String(organizationId)}
          values={TEAM_CREATE_VALUES as TeamProps}
        />
      </div>
    </Card>
  );
}
