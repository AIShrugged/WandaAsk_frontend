import Link from 'next/link';

import { TeamActions } from '@/features/teams/ui/team-actions';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamActionType, TeamProps } from '@/entities/team';
import { ROUTES } from '@/shared/lib/routes';

type Props = {
  team: TeamProps;
  actions: TeamActionType[];
};

export function TeamItem({ team, actions }: Props) {
  const route = `${ROUTES.DASHBOARD.TEAMS}/${team.id}`;

  return (
    <div className='border-b-table'>
      <div className='flex items-center justify-between py-4'>
        <Link className={'flex-1'} href={route}>
          <div className={'flex-1'}>
            <H3>{team.name}</H3>
            <p className='text-sm text-secondary'>
              {team.employee_count < 1
                ? `no employee in ${team.name}`
                : `${team.employee_count} employee`}
            </p>
          </div>
        </Link>

        <TeamActions id={team.id} actions={actions} />
      </div>
    </div>
  );
}
