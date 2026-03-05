'use client';

import Link from 'next/link';

import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

/**
 * OrganizationListEmpty component.
 */
export default function OrganizationListEmpty() {
  const route = `${ROUTES.AUTH.ORGANIZATION}/create`;

  return (
    <div className={'flex flex-col gap-[70px]'}>
      <p className={'text-[20px]'}>
        You don't have any organization invitations. Create your own
        organization and get all the platform's features!
      </p>
      <Link href={route} className='cursor-pointer'>
        <Button>{BUTTON.CREATE} Organization</Button>
      </Link>
    </div>
  );
}
