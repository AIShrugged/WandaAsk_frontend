'use client';

import { Pen, Trash } from 'lucide-react';
import { useTransition } from 'react';

import { deleteMethodology } from '@/app/actions/methodology';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { MethodologyProps } from '@/features/methodology/model/types';

export function MethodologiesAction({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteMethodology(methodology.id);
      } catch {}
    });
  };

  return (
    <div className='flex items-center gap-2'>
      <ButtonIcon
        variant='primary'
        icon={<Pen className='size-[28]' />}
        href={`${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`}
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
