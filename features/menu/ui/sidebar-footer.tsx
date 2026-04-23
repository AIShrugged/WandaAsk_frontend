'use client';

import { Moon, Settings, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ROUTES } from '@/shared/lib/routes';

import type { Theme, UserPreferences } from '@/entities/user';
import type { ActionResult } from '@/shared/types/server-action';

export function SidebarFooter({
  currentPreferences,
  onThemeChange,
}: {
  currentPreferences: UserPreferences;
  onThemeChange: (
    prefs: UserPreferences,
    theme: Theme,
  ) => Promise<ActionResult>;
}) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const previous = theme;
    setTheme(next);

    startTransition(async () => {
      const result = await onThemeChange(currentPreferences, next);
      if (result.error) {
        setTheme(previous);
        toast.error('Failed to save theme preference');
      }
    });
  };

  return (
    <div className='flex items-center justify-end'>
      <button
        type='button'
        onClick={toggleTheme}
        disabled={isPending}
        aria-label={
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        }
        className='cursor-pointer flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors disabled:opacity-50'
      >
        {theme === 'dark' ? (
          <Sun className='w-4 h-4' />
        ) : (
          <Moon className='w-4 h-4' />
        )}
      </button>

      <Link
        href={ROUTES.DASHBOARD.PROFILE_MENU}
        className='cursor-pointer flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors'
        aria-label='Settings'
      >
        <Settings className='w-4 h-4' />
      </Link>
    </div>
  );
}
