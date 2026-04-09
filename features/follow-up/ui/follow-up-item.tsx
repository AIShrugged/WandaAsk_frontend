import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamFollowUpDTO } from '@/entities/team';

/**
 * FollowUpItem component.
 * @param props - Component props.
 * @param props.followUp
 * @returns JSX element.
 */
export function FollowUpItem({ followUp }: { followUp: TeamFollowUpDTO }) {
  const route = followUp.calendar_event
    ? `${ROUTES.DASHBOARD.FOLLOWUPS}/analysis/${followUp.calendar_event.id}`
    : ROUTES.DASHBOARD.FOLLOWUPS;

  return (
    <div className='border-b border-border'>
      <Link
        href={route}
        className='cursor-pointer py-4 flex items-center justify-between'
      >
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <H3>{followUp.calendar_event?.title ?? 'Untitled'}</H3>
          </div>
          <p className='text-sm text-muted-foreground'>
            Organizer: {followUp.user?.name ?? 'Unknown'}
          </p>
          {followUp.created_at && (
            <p className='text-sm text-muted-foreground'>
              {format(new Date(followUp.created_at), 'dd.MM.yyyy')}
            </p>
          )}
        </div>

        <ChevronRight className='text-primary size-5' />
      </Link>
    </div>
  );
}
