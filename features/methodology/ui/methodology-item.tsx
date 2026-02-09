import Link from 'next/link';

import { MethodologiesAction } from '@/features/methodology/ui/methodologies-action';
import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { MethodologyProps } from '@/features/methodology/model/types';

export default function MethodologyItem({
  methodology,
}: {
  methodology: MethodologyProps;
}) {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/${methodology.id}`;

  return (
    <div className='border-b-table'>
      <div className='py-6 flex items-center justify-between group'>
        <Link className={'flex-1'} href={route}>
          <H3>{methodology.name}</H3>
        </Link>

        <MethodologiesAction methodology={methodology} />
      </div>
    </div>
  );
}
