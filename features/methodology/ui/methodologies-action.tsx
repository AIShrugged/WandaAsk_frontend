'use client';

import { Pen, Trash } from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button/button-icon';

import type { MethodologyProps } from '@/features/methodology/model/types';

export function MethodologiesAction({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  return (
    <div className='flex items-center gap-2'>
      <ButtonIcon
        variant='primary'
        icon={<Pen className='size-[28]' />}
        href={`${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`}
      />
      <ButtonIcon
        icon={<Trash className='size-[28]' />}
        variant='danger'
        onClick={() => console.log('delete')}
      />
    </div>
  );
}
