import { Plus } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

/**
 * IssueCreateButton renders the "New" button linking to the issue create page.
 * @returns JSX element.
 */
export default function IssueCreateButton() {
  return (
    <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
      <Link
        href={`${ROUTES.DASHBOARD.ISSUES}/create`}
        className='inline-flex h-10 w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-4 text-sm font-medium text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
      >
        <Plus className='h-4 w-4' />
        New
      </Link>
    </div>
  );
}
