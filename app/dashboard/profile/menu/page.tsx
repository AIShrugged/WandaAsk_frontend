import { getMenuItems } from '@/features/menu';
import { getUser } from '@/features/user';
import { MenuSettingsForm } from '@/features/user-profile';

export const metadata = { title: 'Menu Settings' };

export default async function ProfileMenuPage() {
  const { data: user } = await getUser();
  const allItems = getMenuItems();

  if (!user) {
    return (
      <p className='text-sm text-muted-foreground'>
        Unable to load preferences. Please try again later.
      </p>
    );
  }

  return (
    <MenuSettingsForm
      allItems={allItems}
      initialPrefs={user.preferences?.menu}
    />
  );
}
