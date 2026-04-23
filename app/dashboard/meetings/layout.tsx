import { MeetingsTabsNav } from '@/features/meetings';

import type { PropsWithChildren } from 'react';

/**
 * MeetingsLayout — shared layout for all meetings sub-routes.
 * Renders the card with route-based tab strip.
 */
export default function MeetingsLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-4'>
        <MeetingsTabsNav />
      </div>
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
