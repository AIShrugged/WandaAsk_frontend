import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { H3 } from '@/shared/ui/typography/H3';

import type { TeamFollowUpDTO } from '@/features/teams/model/types';

export function FollowUpItem({ followUp }: { followUp: TeamFollowUpDTO }) {
  const route = `${ROUTES.DASHBOARD.FOLLOWUPS}/${followUp.id}`;

  return (
    <div className='border-b-table'>
      <Link href={route} className='py-4 flex items-center justify-between'>
        <div className='flex-1'>
          <H3>{followUp.text}</H3>
          <p className='text-sm text-secondary'>Soon {followUp.status}</p>
        </div>

        <ChevronRight className='text-accent size-[36px]' />
      </Link>
    </div>
  );
}
