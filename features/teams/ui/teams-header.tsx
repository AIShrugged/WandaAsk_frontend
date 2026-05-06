'use client';

import { Plus } from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonLink } from '@/shared/ui/button';
import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { TeamProps } from '@/entities/team';

interface TeamsHeaderProps {
  teams: TeamProps[];
  selectedTeamId: number;
  onTeamChange: (id: number) => void;
}

/**
 * TeamsHeader — team selector dropdown + "New Team" link.
 */
export default function TeamsHeader({
  teams,
  selectedTeamId,
  onTeamChange,
}: TeamsHeaderProps) {
  const options = teams.map((t) => {
    return { value: String(t.id), label: t.name };
  });

  return (
    <div className='flex items-center gap-3 px-4 py-2 border-b border-border'>
      <div className='w-56 flex-shrink-0'>
        <InputDropdown
          options={options}
          value={String(selectedTeamId)}
          onChange={(val) => {
            onTeamChange(Number(val));
          }}
          placeholder='Select team'
          searchable={options.length > 5}
        />
      </div>

      <ButtonLink
        href={ROUTES.DASHBOARD.TEAMS_CREATE}
        size='xs'
        className='ml-auto'
        leftIcon={<Plus className='size-3.5' />}
        data-tour='create-team-btn'
      >
        New
      </ButtonLink>
    </div>
  );
}
