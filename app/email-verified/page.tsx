'use client';

import { useRouter } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';
import { Card, CardBody } from '@/shared/ui/card';

/**
 * Page component.
 */
export default function Page() {
  const { push } = useRouter();

  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Card>
        <CardBody>
          <div className={'flex flex-col gap-4'}>
            <p>Email verification successful. You can login</p>
            <Button
              onClick={() => {
                return push(ROUTES.AUTH.LOGIN);
              }}
            >
              Go to login page
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
