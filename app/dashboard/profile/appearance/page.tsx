import { getUser } from '@/features/user';
import { AppearanceSection } from '@/features/user-profile';

export const metadata = { title: 'Appearance' };

export default async function ProfileAppearancePage() {
  const { data: user } = await getUser();

  if (!user) {
    return (
      <p className='text-sm text-muted-foreground'>
        Unable to load preferences. Please try again later.
      </p>
    );
  }

  return <AppearanceSection currentPreferences={user.preferences ?? {}} />;
}
