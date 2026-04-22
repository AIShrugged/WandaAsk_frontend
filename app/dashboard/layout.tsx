import { Settings } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import React, { type PropsWithChildren } from 'react';

import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { DemoSeedButtonLoader } from '@/features/demo';
import { MenuSidebar } from '@/features/menu';
import { OrganizationSelector } from '@/features/organization';
import { User } from '@/features/user';
import { ROUTES } from '@/shared/lib/routes';
import { TribesLogo } from '@/shared/ui/brand';
import { CosmicBackground } from '@/shared/ui/layout/cosmic-background';
import {
  DashboardChatColumn,
  DashboardChatLoader,
} from '@/widgets/dashboard-chat';
import MobileSidebar from '@/widgets/layout/ui/mobile-sidebar';

import type { Theme } from '@/entities/user';

const BACKDROP_BLUR = 'blur(20px)';
const VIOLET_BORDER = 'rgba(124,58,237,0.15)';

export default async function Layout({ children }: PropsWithChildren) {
  const cookieStore = await cookies();
  const theme = (cookieStore.get('wanda-theme')?.value ?? 'dark') as Theme;

  return (
    <ThemeProvider initialTheme={theme}>
      <div className='flex h-screen overflow-hidden bg-background'>
        {/* Cosmic space backdrop */}
        <CosmicBackground />

        {/* Desktop sidebar — hidden below lg */}
        <aside
          data-tour='sidebar'
          className='hidden lg:flex flex-col sidebar-width flex-shrink-0 border-r relative z-10'
          style={{
            background: 'rgba(8,8,22,0.75)',
            borderColor: VIOLET_BORDER,
            backdropFilter: BACKDROP_BLUR,
            WebkitBackdropFilter: BACKDROP_BLUR,
          }}
        >
          {/* Logo slot */}
          <div
            className='flex justify-between items-center h-[var(--topbar-height)] px-6 flex-shrink-0'
            style={{ borderBottom: `1px solid ${VIOLET_BORDER}` }}
          >
            <TribesLogo />
            <Link
              href={ROUTES.DASHBOARD.PROFILE_MENU}
              className='flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors'
              aria-label='Settings'
            >
              <Settings className='w-4 h-4' />
            </Link>
          </div>
          {/* Navigation */}
          <div className='flex-1 overflow-y-auto py-3 px-3'>
            <MenuSidebar />
          </div>
          {/* Sidebar footer */}
          <div
            className='flex-shrink-0 px-3 py-3'
            style={{ borderTop: `1px solid ${VIOLET_BORDER}` }}
          ></div>
        </aside>

        {/* Main area */}
        <div className='flex flex-col flex-1 min-w-0 relative z-10'>
          {/* Top bar */}
          <header
            className='flex items-center justify-between h-[var(--topbar-height)] px-4 flex-shrink-0 relative z-20'
            style={{
              background: 'rgba(8,8,22,0.7)',
              borderBottom: `1px solid ${VIOLET_BORDER}`,
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
