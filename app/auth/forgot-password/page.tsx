import { AuthCard, ForgotPasswordForm } from '@/features/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot password — Tribes',
};

export default function Page() {
  return (
    <AuthCard
      title='Forgot password?'
      subtitle='Enter your email and we will send you a reset link'
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
