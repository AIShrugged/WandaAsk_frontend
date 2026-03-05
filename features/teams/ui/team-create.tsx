import Link from 'next/link';

import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

export default function TeamCreate() {
  const route = `${ROUTES.DASHBOARD.TEAMS}/create`;

  return (
    <div className={'mt-auto ml-6 mr-8 mb-6 w-full md:w-[170px]'}>
      <Link href={route} className='cursor-pointer'>
        <Button>{BUTTON.CREATE}</Button>
      </Link>
    </div>
  );
}
