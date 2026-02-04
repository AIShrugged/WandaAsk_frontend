'use client';

import { Pen, Trash } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'react-toastify';

import { deleteMethodology } from '@/features/methodology/api/methodology';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { MethodologyProps } from '@/features/methodology/model/types';

export function MethodologiesAction({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const [isPending, startTransition] = useTransition();
  const isDefault = methodology.id === 1;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMethodology(methodology.id);
        toast.success('Методология успешно удалена');
      } catch {
        toast.error('Не удалось удалить методологию');
      }
    });
  };

  return (
    <div className='flex items-center gap-2'>
      <ButtonIcon
        variant='primary'
        disabled={isDefault}
        icon={<Pen className='size-[28]' />}
        href={`${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`}
      />
      <ButtonIcon
        disabled={isPending || isDefault}
        icon={<Trash className='size-[28]' />}
        variant='danger'
        onClick={handleDelete}
      />
    </div>
  );
}
