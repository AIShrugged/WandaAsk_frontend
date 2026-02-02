import { getUser } from '@/app/actions/user';
import UserErrorBanner from '@/features/user/ui/user-error-banner';
import UserInfo from '@/features/user/ui/user-info';

export default async function User() {
  const { data: user } = await getUser();

  if (!user) {
    return <UserErrorBanner type='notFound' />;
  }

  return <UserInfo user={user} />;
}
