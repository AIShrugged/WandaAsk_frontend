'use client';

import { Moon, Settings, Sun } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { useTheme } from '@/app/providers/ThemeProvider';
import { ROUTES } from '@/shared/lib/routes';
import { ButtonIcon } from '@/shared/ui/button';

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
      <ButtonIcon
        aria-label={
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        }
        icon={
          theme === 'dark' ? (
            <Sun className='w-4 h-4' />
          ) : (
            <Moon className='w-4 h-4' />
          )
        }
        variant='ghost'
        size='md'
        disabled={isPending}
        onClickAction={toggleTheme}
      />
      <ButtonIcon
        aria-label='Settings'
        icon={<Settings className='w-4 h-4' />}
        variant='ghost'
        size='md'
        href={ROUTES.DASHBOARD.PROFILE_MENU}
      />
    </div>
  );
}
