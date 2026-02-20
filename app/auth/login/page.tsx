import { AUTH_TITLE_VARIANT } from '@/features/auth/lib/options';
import AuthTitle from '@/features/auth/ui/auth-title';
import LoginForm from '@/features/auth/ui/login-form';
import Card from '@/shared/ui/card/Card';

export default async function Page() {

  return (
    <Card>
      <div className='w-full max-w-[690px] py-8 px-2 md:py-[100px] md:px-[72px]'>
        <AuthTitle type={AUTH_TITLE_VARIANT.SIGN_IN} />
        <LoginForm />
      </div>
    </Card>
  );
}
