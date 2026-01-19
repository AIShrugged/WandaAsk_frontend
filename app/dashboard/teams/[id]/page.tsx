import React from 'react';

import { getTeam } from '@/app/actions/team';
import TeamMembers from '@/features/teams/ui/team-members';
import ButtonBack from '@/shared/ui/button/button-back';
import Card from '@/shared/ui/card/Card';
import ComponentHeader from '@/shared/ui/layout/component-header';

import type { PageProps } from '@/shared/types/common';

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { data: team } = await getTeam(id);

  if (!team) return null;

  console.log(team);

  return (
    <Card className='min-h-full h-full overflow-x-hidden overflow-y-scroll'>
      <ComponentHeader>
        <ButtonBack />
        <h4 className={'text-[36px] font-normal'}>{team.name}</h4>
      </ComponentHeader>

      <TeamMembers data={team} />
    </Card>
  );
}
