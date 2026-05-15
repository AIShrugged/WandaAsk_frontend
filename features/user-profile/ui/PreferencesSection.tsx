'use client';

import { AppearanceSection } from './AppearanceSection';
import { MenuSettingsForm } from './MenuSettingsForm';

import type { UserPreferences } from '@/entities/user';
import type { MenuProps } from '@/features/menu/model/types';

export function PreferencesSection({
  preferences,
  allMenuItems,
}: {
  preferences: UserPreferences;
  allMenuItems: MenuProps[];
}) {
  return (
    <div className='flex flex-col gap-8'>
      <div>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Theme</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Choose your preferred color scheme.
          </p>
        </div>
        <AppearanceSection currentPreferences={preferences} />
      </div>

      <hr className='border-border' />

      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Navigation</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Reorder and show or hide items in the sidebar.
          </p>
        </div>
        <MenuSettingsForm
          allItems={allMenuItems}
          initialPrefs={preferences?.menu}
          currentPreferences={preferences}
        />
      </section>
    </div>
  );
}
