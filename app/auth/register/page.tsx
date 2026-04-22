import { Suspense } from 'react';

import { RegisterForm } from '@/features/auth';
import { TribesLogo } from '@/shared/ui/brand';
import Card from '@/shared/ui/card/Card';

/**
 * Page component.
 */
export default function Page() {
  return (
    <div className='w-full max-w-[400px]'>
      <div className='flex justify-center mb-8'>
        <TribesLogo />
      </div>

      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>
              Create account
            </h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Fill in the details below to get started
            </p>
          </div>
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </Card>
    </div>
  );
}
