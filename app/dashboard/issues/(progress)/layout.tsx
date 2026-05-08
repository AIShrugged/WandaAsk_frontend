import { IssuesTabsNav } from '@/features/issues/ui/issues-tabs-nav';
import { Card } from '@/shared/ui/card';

import type { PropsWithChildren } from 'react';

export default function IssuesProgressLayout({ children }: PropsWithChildren) {
  return (
    <Card className='overflow-hidden'>
      <IssuesTabsNav />
      {children}
    </Card>
  );
}
