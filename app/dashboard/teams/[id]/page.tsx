import React from 'react';

import { getTeam } from '@/app/actions/team';
import TeamMembers from '@/features/teams/ui/team-members';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { data: team } = await getTeam(id);

  if (!team) return null;

  return (
    <Card className='min-h-full h-full overflow-x-hidden overflow-y-scroll'>
      <PageHeader hasButtonBack title={team.name}></PageHeader>
      <TeamMembers data={team} />
    </Card>
  );
}
