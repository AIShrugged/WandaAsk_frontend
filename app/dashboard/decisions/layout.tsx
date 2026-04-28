import { DecisionsTabsNav } from '@/features/decisions/ui/decisions-tabs-nav';
import Card from '@/shared/ui/card/Card';

import type { PropsWithChildren } from 'react';

export default function DecisionsLayout({ children }: PropsWithChildren) {
  return (
    <Card className='overflow-hidden'>
      <div className='px-4 pt-4 pb-2'>
        <DecisionsTabsNav />
      </div>
      <div className='px-4 pb-4'>{children}</div>
    </Card>
  );
}
