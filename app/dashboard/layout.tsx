import React, { type PropsWithChildren } from 'react';

import DemoSeedButton from '@/features/demo/ui/demo-seed-button';
import { MenuSidebar } from '@/features/menu';
import OrganizationSelector from '@/features/organization/ui/organization-selector';
import User from '@/features/user/ui/user';
import { TribesLogo } from '@/shared/ui/brand';
import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar';

export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div className='flex h-screen bg-background overflow-hidden'>
      {/* Desktop sidebar — hidden below lg */}
      <aside className='hidden lg:flex flex-col sidebar-width flex-shrink-0 bg-sidebar border-r border-sidebar-border'>
        {/* Logo slot */}
        <div className='flex items-center h-[var(--topbar-height)] px-6 border-b border-sidebar-border flex-shrink-0'>
          <TribesLogo />
        </div>
        {/* Navigation */}
        <div className='flex-1 overflow-y-auto py-3 px-3'>
          <MenuSidebar />
        </div>
      </aside>

      {/* Main area */}
      <div className='flex flex-col flex-1 min-w-0'>
        {/* Top bar */}
        <header className='flex items-center justify-between h-[var(--topbar-height)] px-4 border-b border-border bg-background flex-shrink-0'>
          <div className='flex items-center gap-3'>
            {/* Mobile sidebar trigger — visible below lg */}
            <MobileSidebar>
              <MenuSidebar />
            </MobileSidebar>
            <OrganizationSelector />
          </div>
          <div className='flex items-center gap-2'>
            <DemoSeedButton />
            <User />
          </div>
        </header>

        {/* Scrollable content */}
        <main className='flex-1 overflow-y-auto p-2 min-h-0'>{children}</main>
      </div>
    </div>
  );
}
