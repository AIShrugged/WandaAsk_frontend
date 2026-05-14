'use client';

import { Plus } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonLink } from '@/shared/ui/button';

export default function IssueCreateButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams.toString();
  const from = encodeURIComponent(params ? `${pathname}?${params}` : pathname);

  return (
    <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
      <ButtonLink
        href={`${ROUTES.DASHBOARD.ISSUES}/create?from=${from}`}
        leftIcon={<Plus className='h-4 w-4' />}
      >
        New
      </ButtonLink>
    </div>
  );
}
