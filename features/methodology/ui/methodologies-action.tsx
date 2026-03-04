'use client';

import { Pen, Trash } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { deleteMethodology } from '@/features/methodology/api/methodology';
import { useMethodologyStore } from '@/features/methodology/model/methodology-store';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { MethodologyProps } from '@/features/methodology/model/types';

export function MethodologiesAction({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const [isPending, startTransition] = useTransition();
  const removeItem = useMethodologyStore(state => state.removeItem);
  const isDefault = methodology.id === 1;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMethodology(methodology.id);
        removeItem(methodology.id);
        toast.success(`Methodology ${methodology.name} deleted`);
      } catch {
        toast.error(`Cant delete ${methodology.name}`);
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
