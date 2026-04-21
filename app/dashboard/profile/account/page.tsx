import { getUser } from '@/features/user';
import { ProfileForm } from '@/features/user-profile';
import { RestartTourSection } from '@/features/virtual-tour';

export const metadata = { title: 'Account Info' };

/**
 * Account Info tab — displays the profile form and tour restart section.
 */
export default async function ProfileAccountPage() {
  const { data: user } = await getUser();

  if (!user) {
    return (
      <p className='text-sm text-muted-foreground'>
        Unable to load profile. Please try again later.
      </p>
    );
  }

  return (
    <>
      <ProfileForm user={user} />
      <RestartTourSection />
    </>
  );
}
