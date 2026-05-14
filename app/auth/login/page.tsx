import { AuthCard, LoginForm } from '@/features/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Tribes',
};

export default function Page() {
  return (
    <AuthCard
      title='Sign in'
      subtitle='Welcome back — enter your credentials to continue'
    >
      <LoginForm />
    </AuthCard>
  );
}
