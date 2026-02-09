import { Suspense } from 'react';

import { AUTH_TITLE_VARIANT } from '@/features/auth/lib/options';
import AuthTitle from '@/features/auth/ui/auth-title';
import RegisterForm from '@/features/auth/ui/register-form';
import Card from '@/shared/ui/card/Card';

export default function Page() {
  return (
    <Card>
      <div className={'w-[690px] py-[100px] px-[72px]'}>
        <AuthTitle type={AUTH_TITLE_VARIANT.REGISTER} />
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </Card>
  );
}
