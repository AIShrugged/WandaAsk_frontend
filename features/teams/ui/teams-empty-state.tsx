'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

/**
 * TeamsEmptyState — shown when no teams exist in the organization.
 */
export default function TeamsEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center flex-1 py-24 gap-4 text-center px-6'>
      <div className='w-14 h-14 rounded-full bg-muted flex items-center justify-center'>
        <Users className='size-7 text-muted-foreground' />
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-base font-semibold text-foreground'>No teams yet</p>
        <p className='text-sm text-muted-foreground max-w-xs'>
          Create your first team to start tracking meetings, tasks and people.
        </p>
      </div>
      <Link
        href={ROUTES.DASHBOARD.TEAMS_CREATE}
        className='inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-6 text-sm font-medium text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
      >
        Create team
      </Link>
    </div>
  );
}
