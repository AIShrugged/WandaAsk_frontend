import { Plus } from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonLink } from '@/shared/ui/button';

export default function IssueCreateButton() {
  return (
    <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
      <ButtonLink
        href={`${ROUTES.DASHBOARD.ISSUES}/create`}
        leftIcon={<Plus className='h-4 w-4' />}
      >
        New
      </ButtonLink>
    </div>
  );
}
