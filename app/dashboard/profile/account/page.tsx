import { getUser } from '@/features/user';
import { ProfileAccountSection } from '@/features/user-profile';

export const metadata = { title: 'Account' };

export default async function ProfileAccountPage() {
  const { data: user } = await getUser();

  return <ProfileAccountSection user={user} />;
}
