import Link from 'next/link';

import { TeamActions } from '@/features/teams/ui/team-actions';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamActionType, TeamProps } from '@/entities/team';

type Props = {
  team: TeamProps;
  actions: TeamActionType[];
  href?: string;
};

/**
 * TeamItem component.
 * @param actions.team
 * @param actions - actions.
 * @param actions.actions
 * @param href - href.
 * @param actions.href
 */
export function TeamItem({ team, actions, href }: Props) {
  const route = `${href}/${team.id}`;

  const employeeSuffix = team.employee_count === 1 ? '' : 's';

  const employeeLabel =
    team.employee_count < 1
      ? `No employees in ${team.name}`
      : `${team.employee_count} employee${employeeSuffix}`;

  return (
    <div className='border-b border-border'>
      <div className='flex items-center justify-between py-4'>
        <Link className='cursor-pointer flex-1' href={route}>
          <div className='flex-1'>
            <H3>{team.name}</H3>
            <p className='text-sm text-muted-foreground'>{employeeLabel}</p>
          </div>
        </Link>

        <TeamActions id={team.id} actions={actions} />
      </div>
    </div>
  );
}
