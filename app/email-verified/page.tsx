'use client';

import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { Button } from '@/shared/ui/button/Button';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/shared/lib/routes';

export default function Page() {
  const { push } = useRouter();

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Card>
        <CardBody>
          <div className={'flex flex-col gap-4'}>
            <p>Email verification successful. You can login</p>
            <Button onClick={() => push(ROUTES.AUTH.LOGIN)}>
              Go to login page
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
