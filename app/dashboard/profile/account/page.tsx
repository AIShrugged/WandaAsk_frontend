import { getUser } from '@/features/user';
import { ProfileForm } from '@/features/user-profile';

export const metadata = { title: 'Info' };

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
    <div className='flex flex-col gap-6'>
      <ProfileForm user={user} />
    </div>
  );
}
