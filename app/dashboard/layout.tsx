import React, { type PropsWithChildren } from 'react';

import { DemoSeedButtonLoader } from '@/features/demo/ui/demo-seed-button-loader';
import { MenuSidebar } from '@/features/menu';
import OrganizationSelector from '@/features/organization/ui/organization-selector';
import User from '@/features/user/ui/user';
import { TribesLogo } from '@/shared/ui/brand';
import { CosmicBackground } from '@/shared/ui/layout/cosmic-background';
import { DashboardChatColumn, DashboardChatLoader } from '@/widgets/dashboard-chat';
import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar';

const BACKDROP_BLUR = 'blur(20px)';

/**
 * Layout component.
 * @param props - Component props.
 * @param props.children
 * @returns JSX element.
 */
export default async function Layout({ children }: PropsWithChildren) {
  return (
    <div
      className='flex h-screen overflow-hidden'
      style={{ background: 'hsl(240 40% 2%)' }}
    >
      {/* Cosmic space backdrop */}
      <CosmicBackground />

      {/* Desktop sidebar — hidden below lg */}
      <aside
        className='hidden lg:flex flex-col sidebar-width flex-shrink-0 border-r relative z-10'
        style={{
          background: 'rgba(8,8,22,0.75)',
          borderColor: 'rgba(124,58,237,0.15)',
          backdropFilter: BACKDROP_BLUR,
          WebkitBackdropFilter: BACKDROP_BLUR,
        }}
      >
        {/* Logo slot */}
        <div
          className='flex items-center h-[var(--topbar-height)] px-6 flex-shrink-0'
          style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}
        >
          <TribesLogo />
        </div>
        {/* Navigation */}
        <div className='flex-1 overflow-y-auto py-3 px-3'>
          <MenuSidebar />
        </div>
      </aside>

      {/* Main area */}
      <div className='flex flex-col flex-1 min-w-0 relative z-10'>
        {/* Top bar */}
        <header
          className='flex items-center justify-between h-[var(--topbar-height)] px-4 flex-shrink-0 relative z-20'
          style={{
            background: 'rgba(8,8,22,0.7)',
            borderBottom: '1px solid rgba(124,58,237,0.15)',
            backdropFilter: BACKDROP_BLUR,
            WebkitBackdropFilter: BACKDROP_BLUR,
          }}
        >
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            {/* Mobile sidebar trigger — visible below lg */}
            <MobileSidebar>
              <MenuSidebar />
            </MobileSidebar>
            <OrganizationSelector />
          </div>
          <div className='flex items-center gap-2 flex-shrink-0'>
            <DemoSeedButtonLoader />
            <User />
          </div>
        </header>

        {/* Scrollable content */}
        <main className='flex-1 overflow-y-auto p-2 min-h-0'>{children}</main>
      </div>

      {/* Chat panel — third column, hidden on xl- screens and /dashboard/chat */}
      <DashboardChatColumn>
        <DashboardChatLoader />
      </DashboardChatColumn>
    </div>
  );
}
