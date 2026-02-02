'use client';

import { ChevronRightIcon, Trash, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useTransition } from 'react';
import { toast } from 'react-toastify';

import { deleteTeam } from '@/app/actions/team';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import { useModal } from '@/shared/hooks/use-modal';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { TeamActionType, TeamProps } from '@/features/teams/model/types';

type Props = Pick<TeamProps, 'id'> & {
  actions: TeamActionType[];
};

export function TeamActions({ id, actions }: Props) {
  const [isPending, startTransition] = useTransition();
  const { push } = useRouter();
  const { open, close } = useModal();

  const handleOpenModal = () => {
    if (open) {
      open(<TeamMemberAddModal close={close} />);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const error = await deleteTeam(id);
        if (error) {
          toast.error('Не удалось удалить команду');
        } else {
          toast.success('Команда успешно удалена');
        }
      } catch {
        toast.error('Произошла ошибка при удалении команды');
      }
    });
  };

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
        onClick={handleOpenModal}
      />
    ),
    delete: (
      <ButtonIcon
        key='delete'
        disabled={isPending}
        icon={<Trash className='size-[28]' />}
        variant='danger'
        onClick={handleDelete}
      />
    ),
    view: (
      <ButtonIcon
        key='view'
        disabled={isPending}
        icon={<ChevronRightIcon className='size-[28]' />}
        variant='primary'
        onClick={handleViewTeamFollowUp}
      />
    ),
  };

  return (
    <div className='flex items-center gap-2'>
      {actions.map(action => actionMap[action])}
    </div>
  );
}
