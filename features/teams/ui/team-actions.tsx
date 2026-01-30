'use client';

import { Trash, UserPlus } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'react-toastify';

import { deleteTeam } from '@/app/actions/team';
import TeamMemberAddModal from '@/features/teams/ui/team-member-add-modal';
import { useModal } from '@/shared/hooks/use-modal';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

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

  return (
    <div className='flex items-center gap-2'>
      <ButtonIcon
        disabled={isPending}
        icon={<UserPlus className='size-[28]' />}
        variant='primary'
        onClick={handleOpenModal}
      />
      <ButtonIcon
        disabled={isPending}
        icon={<Trash className='size-[28]' />}
        variant='danger'
        onClick={handleDelete}
      />
    </div>
  );
}
