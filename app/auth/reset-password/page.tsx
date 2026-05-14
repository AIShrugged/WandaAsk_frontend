import { Suspense } from 'react';

import { AuthCard, ResetPasswordForm } from '@/features/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset password — Tribes',
};

export default function Page() {
  return (
    <AuthCard title='Reset password' subtitle='Enter your new password below'>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
