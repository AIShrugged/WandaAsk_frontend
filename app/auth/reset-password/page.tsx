import { Suspense } from 'react';

import { ResetPasswordForm } from '@/features/auth';
import { TribesLogo } from '@/shared/ui/brand';
import { Card } from '@/shared/ui/card';

export default async function Page() {
  return (
    <div className='w-full max-w-[400px]'>
      <div className='flex justify-center mb-8'>
        <TribesLogo />
      </div>

      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>
              Reset password
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Enter your new password below
            </p>
          </div>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
