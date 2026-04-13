import { ChangePasswordForm } from '@/features/user-profile';

export const metadata = { title: 'Change Password' };

/**
 * Password tab — displays the change password form.
 */
export default function ProfilePasswordPage() {
  return <ChangePasswordForm />;
}
