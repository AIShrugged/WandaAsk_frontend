import LoginForm from '@/features/auth/ui/login-form';
import { TribesLogo } from '@/shared/ui/brand';
import Card from '@/shared/ui/card/Card';

export default async function Page() {
  return (
    <div className='w-full max-w-[400px]'>
      <div className='flex justify-center mb-8'>
        <TribesLogo />
      </div>

      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>Sign in</h1>
            <p className='text-sm text-muted-foreground mt-1'>
              Welcome back — enter your credentials to continue
            </p>
          </div>
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
