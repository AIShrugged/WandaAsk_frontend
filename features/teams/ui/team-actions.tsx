'use client';

import { Trash, UserPlus } from 'lucide-react';
import { useTransition } from 'react';

import { deleteTeam } from '@/app/actions/team';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import { useModal } from '@/shared/hooks/use-modal';

import type { TeamProps } from '@/features/teams/model/types';

export function TeamActions({ id }: Pick<TeamProps, 'id'>) {
  const [isPending, startTransition] = useTransition();
  const { open, close } = useModal();

  const handleOpenModal = () => {
    if (open) {
      open(<TeamMemberAddModal close={close} />);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTeam(id);
      } catch {}
    });
  };

  return (
    <div className='flex items-center gap-2'>
      <button
        onClick={handleOpenModal}
        disabled={isPending}
        className='group rounded-lg transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
        aria-label='Add team member'
        type='button'
      >
        <UserPlus className='size-7 text-neutral-400 transition-colors group-hover:enabled:text-accent group-disabled:text-neutral-300' />
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className='group rounded-lg transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
        aria-label='Add team member'
        type='button'
      >
        <Trash className='size-7 text-neutral-400 transition-colors group-hover:enabled:text-accent group-disabled:text-neutral-300' />
      </button>
    </div>
  );
}
