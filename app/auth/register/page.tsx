import { Suspense } from 'react';

import { AuthCard, RegisterForm } from '@/features/auth';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account — Tribes',
};

export default function Page() {
  return (
    <AuthCard
      title='Create account'
      subtitle='Fill in the details below to get started'
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
