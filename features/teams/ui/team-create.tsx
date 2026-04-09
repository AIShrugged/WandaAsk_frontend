import Link from 'next/link';

import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

/**
 * TeamCreate component.
 * @returns JSX element.
 */
export default function TeamCreate() {
  const route = `${ROUTES.DASHBOARD.TEAMS}/create`;

  return (
    <div className={'mt-auto mx-4 md:ml-6 md:mr-8 mb-6 w-auto md:w-[170px]'}>
      <Link href={route} className='cursor-pointer'>
        <Button>{BUTTON.CREATE}</Button>
      </Link>
    </div>
  );
}
