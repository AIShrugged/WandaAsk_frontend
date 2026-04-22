'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { useTheme } from '@/app/providers/ThemeProvider';
import { updateThemePreference } from '@/features/user-profile/api/preferences';

import type { Theme, UserPreferences } from '@/entities/user';

interface Props {
  currentPreferences: UserPreferences;
}

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'dark', label: 'Dark', description: 'Cosmic dark theme (default)' },
  {
    value: 'light',
    label: 'Light',
    description: 'Light theme for bright environments',
  },
];

export function AppearanceSection({ currentPreferences }: Props) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const handleThemeChange = (next: Theme) => {
    const previous = theme;
    setTheme(next);

    startTransition(async () => {
      const result = await updateThemePreference(currentPreferences, next);
      if (result.error) {
        setTheme(previous);
        toast.error('Failed to save theme preference');
      }
    });
  };

  return (
    <section aria-labelledby='appearance-heading' className='space-y-6'>
      <div>
        <h2 id='appearance-heading' className='text-lg font-semibold'>
          Appearance
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Choose your preferred display theme.
        </p>
      </div>

      <div
        role='radiogroup'
        aria-label='Theme selection'
        className='grid grid-cols-2 gap-3'
      >
        {THEMES.map(({ value, label, description }) => {
          return (
            <label
              key={value}
              className={[
                'flex flex-col gap-1 rounded-lg border p-4 cursor-pointer transition-colors select-none',
                theme === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending ? 'opacity-60 pointer-events-none' : '',
              ].join(' ')}
            >
              <input
                type='radio'
                name='theme'
                value={value}
                checked={theme === value}
                onChange={() => {
                  handleThemeChange(value);
                }}
                className='sr-only'
              />
              <span className='font-medium'>{label}</span>
              <span className='text-xs text-muted-foreground'>
                {description}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
