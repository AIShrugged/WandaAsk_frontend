import { getUser } from '@/features/user';
import { FocusBlock } from '@/features/user-focus';
import { getUserFocus } from '@/features/user-focus/api/focus';
import { ProfileForm } from '@/features/user-profile';

export const metadata = { title: 'Info' };

/**
 * Info tab — displays the profile form and focus block.
 */
export default async function ProfileAccountPage() {
  const [{ data: user }, focus] = await Promise.all([
    getUser(),
    getUserFocus().catch(() => {
      return null;
    }),
  ]);

  if (!user) {
    return (
      <p className='text-sm text-muted-foreground'>
        Unable to load profile. Please try again later.
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <ProfileForm user={user} />
      <FocusBlock initialFocus={focus} />
    </div>
  );
}
