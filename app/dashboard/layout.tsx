import { cookies } from 'next/headers';
import React, { type PropsWithChildren } from 'react';

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { DemoSeedButtonLoader } from '@/features/demo';
import { MenuSidebar, SidebarFooter } from '@/features/menu';
import { OrganizationSelector } from '@/features/organization';
import { User, getUser } from '@/features/user';
import { updateThemePreference } from '@/features/user-profile/api/preferences';
import { TribesLogo } from '@/shared/ui/brand';
import {
  DashboardChatColumn,
  DashboardChatLoader,
} from '@/widgets/dashboard-chat';
import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar';

import type { Theme } from '@/entities/user';

export default async function Layout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get('wanda-theme')?.value ?? 'dark') as Theme;
  const { data: user } = await getUser();

  return (
    <ThemeProvider initialTheme={theme}>
      <div className='flex h-screen overflow-hidden bg-background'>
        {/* Desktop sidebar — hidden below lg */}
        <aside
          data-tour='sidebar'
          className='hidden lg:flex flex-col sidebar-width flex-shrink-0 border-r relative z-10'
          style={{
            background: 'var(--chrome-bg)',
            borderColor: 'var(--chrome-border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo slot */}
          <div
            className='flex items-center h-[var(--topbar-height)] px-6 flex-shrink-0'
            style={{ borderBottom: '1px solid var(--chrome-border)' }}
          >
            <TribesLogo />
          </div>
          {/* Navigation */}
          <div className='flex-1 overflow-y-auto py-3 px-3'>
            <MenuSidebar />
          </div>
          {/* Sidebar footer */}
          <div
            className='flex-shrink-0 px-3 py-3'
            style={{ borderTop: '1px solid var(--chrome-border)' }}
          >
            <SidebarFooter
              currentPreferences={user?.preferences ?? {}}
              onThemeChange={updateThemePreference}
            />
          </div>
        </aside>

        {/* Main area */}
        <div className='flex flex-col flex-1 min-w-0 relative z-10'>
          {/* Top bar */}
          <header
            className='flex items-center justify-between h-[var(--topbar-height)] px-4 flex-shrink-0 relative z-20'
            style={{
              background: 'var(--chrome-bg-header)',
              borderBottom: '1px solid var(--chrome-border)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
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
          <main
            data-tour='main-content'
            className='flex-1 overflow-y-auto p-2 min-h-0'
          >
            {children}
          </main>
        </div>

        {/* Chat panel — third column, hidden on xl- screens and /dashboard/chat */}
        <DashboardChatColumn>
          <DashboardChatLoader />
        </DashboardChatColumn>
      </div>
    </ThemeProvider>
  );
}
