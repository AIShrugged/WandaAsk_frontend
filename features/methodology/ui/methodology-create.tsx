'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { BUTTON } from '@/shared/lib/buttons';
import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';

export default function MethodologyCreate() {
  const route = `${ROUTES.DASHBOARD.METHODOLOGY}/create`;

  return (
    <div className={'mt-auto ml-6 mr-8 mb-6 w-[240px]'}>
      <Link href={route}>
        <Button type='submit'>
          <Plus /> {BUTTON.ADD} methodology
        </Button>
      </Link>
    </div>
  );
}
