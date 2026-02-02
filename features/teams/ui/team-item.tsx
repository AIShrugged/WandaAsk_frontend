import Link from 'next/link';

import { TeamActions } from '@/features/teams/ui/team-actions';
import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamActionType, TeamProps } from '@/features/teams/model/types';

type Props = {
  team: TeamProps;
  actions: TeamActionType[];
};

export function TeamItem({ team, actions }: Props) {
  return (
    <div className='flex items-center justify-between border-b-table py-4.5'>
      <div className={'flex-1'}>
        <H3>{team.name}</H3>
        <p className='text-sm text-secondary'>
          {team.employee_count < 1
            ? `no employee in ${team.name}`
            : `${team.employee_count} employee`}
        </p>
      </div>

      <TeamActions id={team.id} actions={actions} />
    </div>
  );
}
