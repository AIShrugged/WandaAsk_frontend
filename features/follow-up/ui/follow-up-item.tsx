import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamFollowUpDTO } from '@/entities/team';

export function FollowUpItem({ followUp }: { followUp: TeamFollowUpDTO }) {
  const route = `${ROUTES.DASHBOARD.FOLLOWUPS}/analysis/${followUp.calendar_event.id}`;

  return (
    <div className='border-b-table'>
      <Link href={route} className='py-4 flex items-center justify-between'>
        <div className='flex-1'>
          <H3>{followUp?.calendar_event.title}</H3>
          <p className='text-sm text-secondary'>
            Organizer: {followUp?.user.name}
          </p>
          <p className='text-sm text-secondary'>
            {format(new Date(followUp.created_at), 'dd.MM.yyyy')}
          </p>
        </div>

        <ChevronRight className='text-accent size-[36px]' />
      </Link>
    </div>
  );
}
