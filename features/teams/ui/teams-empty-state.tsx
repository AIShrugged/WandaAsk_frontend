'use client';

import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

import TeamCreateModal from './team-create-modal';

interface TeamsEmptyStateProps {
  organizationId: string;
}

/**
 * TeamsEmptyState — shown when no teams exist in the organization.
 */
export default function TeamsEmptyState({
  organizationId,
}: TeamsEmptyStateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleTeamCreated = (teamId: number) => {
    setIsModalOpen(false);
    router.replace(`${ROUTES.DASHBOARD.TEAMS}?team_id=${teamId}`);
  };

  return (
    <>
      <div className='flex flex-col items-center justify-center flex-1 py-24 gap-4 text-center px-6'>
        <div className='w-14 h-14 rounded-full bg-muted flex items-center justify-center'>
          <Users className='size-7 text-muted-foreground' />
        </div>
        <div className='flex flex-col gap-1'>
          <p className='text-base font-semibold text-foreground'>
            No teams yet
          </p>
          <p className='text-sm text-muted-foreground max-w-xs'>
            Create your first team to start tracking meetings, tasks and people.
          </p>
        </div>
        <Button
          onClick={() => {
            return setIsModalOpen(true);
          }}
        >
          Create team
        </Button>
      </div>

      {isModalOpen && (
        <TeamCreateModal
          close={() => {
            return setIsModalOpen(false);
          }}
          organizationId={organizationId}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </>
  );
}
