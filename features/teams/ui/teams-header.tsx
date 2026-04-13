'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import InputDropdown from '@/shared/ui/input/InputDropdown';

import TeamCreateModal from './team-create-modal';

import type { TeamProps } from '@/entities/team';

interface TeamsHeaderProps {
  teams: TeamProps[];
  selectedTeamId: number;
  organizationId: string;
  onTeamChange: (id: number) => void;
  onTeamCreated: (teamId: number) => void;
}

/**
 * TeamsHeader — team selector dropdown + "Add Team" button.
 */
export default function TeamsHeader({
  teams,
  selectedTeamId,
  organizationId,
  onTeamChange,
  onTeamCreated,
}: TeamsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const options = teams.map((t) => {
    return { value: String(t.id), label: t.name };
  });

  return (
    <>
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

        <div className='ml-auto'>
          <button
            type='button'
            onClick={() => {
              return setIsModalOpen(true);
            }}
            className='flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-400 transition-colors font-medium'
          >
            <Plus className='size-4' />
            Add Team
          </button>
        </div>
      </div>

      {isModalOpen && (
        <TeamCreateModal
          close={() => {
            return setIsModalOpen(false);
          }}
          organizationId={organizationId}
          onTeamCreated={(teamId) => {
            setIsModalOpen(false);
            onTeamCreated(teamId);
          }}
        />
      )}
    </>
  );
}
