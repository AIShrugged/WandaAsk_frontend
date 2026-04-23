import { AgentsTabsNav } from '@/features/agents';

import type { PropsWithChildren } from 'react';

/**
 * AgentsLayout — shared layout for all agent sub-routes.
 * Renders the page card with header and route-based tab strip.
 */
export default function AgentsLayout({ children }: PropsWithChildren) {
  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <div className='shrink-0 mb-4'>
        <AgentsTabsNav />
      </div>
      <div className='flex-1 overflow-y-auto'>{children}</div>
    </div>
  );
}
