import { redirect } from 'next/navigation';

import { getMenuItems } from '@/features/menu';
import { getUser } from '@/features/user';
import { PreferencesSection } from '@/features/user-profile';
import { ROUTES } from '@/shared/lib/routes';

export const metadata = { title: 'Preferences' };

export default async function ProfilePreferencesPage() {
  const { data: user } = await getUser();
  const allItems = getMenuItems();

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  return (
    <PreferencesSection
      preferences={user.preferences ?? {}}
      allMenuItems={allItems}
    />
  );
}
