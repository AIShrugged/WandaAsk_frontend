'use client';

import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { Button } from '@/shared/ui/button/Button';

export default function Page() {
  return (
    <div className='w-full h-screen flex items-center justify-center'>
      <Card>
        <CardBody>
          <div className={'flex flex-col gap-4'}>
            <p>Email verification successful. You may close this window</p>
            <Button onClick={() => window.close()}>Close</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
