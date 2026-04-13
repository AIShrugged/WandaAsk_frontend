'use client';

import { ChevronRightIcon, Trash, UserPlus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteTeam } from '@/features/teams/api/team';
import { useTeamsStore } from '@/features/teams/model/teams-store';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import { useModal } from '@/shared/hooks/use-modal';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { TeamActionType, TeamProps } from '@/entities/team';

type Props = Pick<TeamProps, 'id'> & {
  actions: TeamActionType[];
};

/**
 * TeamActions component.
 * @param actions.id
 * @param actions - actions.
 * @param actions.actions
 */
export function TeamActions({ id, actions }: Props) {
  const [isPending, startTransition] = useTransition();
  const { push, replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open, close } = useModal();
  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete('team_id');
    replace(`${pathname}?${params.toString()}`);
    close();
  }, [close, pathname, replace, searchParams]);
  /**
   * handleOpenModal.
   */
  const handleOpenModal = () => {
    if (open) {
      const params = new URLSearchParams(searchParams.toString());

      params.set('team_id', String(id));
      replace(`${pathname}?${params.toString()}`);
      open(<TeamMemberAddModal close={handleClose} />);
    }
  };
  /**
   * handleDelete.
   */
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const error = await deleteTeam(id);

        if (error) {
          toast.error('Failed to delete team');
        } else {
          useTeamsStore.getState().invalidate();
          toast.success('Team deleted');
        }
      } catch {
        toast.error('An error occurred while deleting the team');
      }
    });
  };
  /**
   * handleViewTeamFollowUp.
   */
  const handleViewTeamFollowUp = () => {
    push(`${ROUTES.DASHBOARD.FOLLOWUPS}/${String(id)}`);
  };
  const actionMap: Record<TeamActionType, ReactNode> = {
    'add-member': (
      <ButtonIcon
        key='add-member'
        disabled={isPending}
        icon={<UserPlus className='size-[28]' />}
        variant='primary'
        onClickAction={handleOpenModal}
      />
    ),
    delete: (
      <ButtonIcon
        key='delete'
        disabled={isPending}
        icon={<Trash className='size-[28]' />}
        variant='danger'
        onClickAction={handleDelete}
      />
    ),
    view: (
      <ButtonIcon
        key='view'
        disabled={isPending}
        icon={<ChevronRightIcon className='size-[28]' />}
        variant='primary'
        onClickAction={handleViewTeamFollowUp}
      />
    ),
  };

  return (
    <div className='flex items-center gap-2'>
      {actions.map((action) => {
        return actionMap[action];
      })}
    </div>
  );
}
