'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
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

      <Link
        href={ROUTES.DASHBOARD.TEAMS_CREATE}
        data-tour='create-team-btn'
        className='ml-auto inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-3 text-xs font-medium text-primary-foreground shadow-[0_2px_8px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
      >
        <Plus className='size-3.5' />
        New
      </Link>
    </div>
  );
}
