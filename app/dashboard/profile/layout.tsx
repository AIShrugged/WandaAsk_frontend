import { ProfileTabsNav } from '@/features/user-profile';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { ReactNode } from 'react';

/**
 * ProfileLayout — shared layout for all profile sub-routes.
 * Renders the page card with header and route-based tab strip.
 */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Profile' />
      <div className='h-full overflow-y-auto'>
        <div className='flex flex-col gap-5 p-6 h-full'>
          <ProfileTabsNav />
          <div className='max-w-xl'>{children}</div>
        </div>
      </div>
    </Card>
  );
}
