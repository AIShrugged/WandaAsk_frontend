'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

/**
 * MethodologyCreate component.
 * @returns JSX element.
 */
export default function MethodologyCreate() {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/create`;

  return (
    <div className={'mt-auto mx-4 md:ml-6 md:mr-8 mb-6 w-auto md:w-[240px]'}>
      <Link href={route} className='cursor-pointer'>
        <Button type='submit'>
          <Plus /> {BUTTON.ADD} methodology
        </Button>
      </Link>
    </div>
  );
}
