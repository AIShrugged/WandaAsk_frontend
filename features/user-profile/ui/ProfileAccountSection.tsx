import { ChangePasswordForm } from './ChangePasswordForm';
import { ProfileForm } from './ProfileForm';

import type { UserProps } from '@/entities/user';

interface Props {
  user: UserProps | null;
}

export function ProfileAccountSection({ user }: Props) {
  return (
    <div className='flex flex-col gap-6'>
      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Profile Information</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Update your display name.
          </p>
        </div>
        {user ? (
          <ProfileForm user={user} />
        ) : (
          <p className='text-sm text-muted-foreground'>
            Unable to load profile. Please try again later.
          </p>
        )}
      </section>

      <hr className='border-border' />

      <section>
        <div className='mb-6'>
          <h2 className='text-base font-semibold'>Change Password</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Changing your password will sign out all other active sessions.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
