'use client';

import { Users } from 'lucide-react';

import { ROUTES } from '@/shared/lib/routes';
import { ButtonLink } from '@/shared/ui/button';

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
      <ButtonLink href={ROUTES.DASHBOARD.TEAMS_CREATE}>Create team</ButtonLink>
    </div>
  );
}
