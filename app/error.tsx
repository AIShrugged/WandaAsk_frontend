'use client';

import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import ButtonCopy from '@/shared/ui/button/button-copy';
import Card from '@/shared/ui/card/Card';
import { H2 } from '@/shared/ui/typography/H2';

// eslint-disable-next-line sonarjs/no-globals-shadowing
export default function Error({
                                error,
                                reset,
                              }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <div className='flex flex-col items-center justify-center text-center p-4'>
        <AlertCircle className='h-12 w-12 text-destructive mb-4' />
        <H2>An error occurred</H2>
        <p>Please email (info@spodial.com) us the error</p>

        <Image
          alt={'error'}
          height={320}
          width={320}
          src={'/images/icons/error.png'}
        />

        <div className={'flex flex-row gap-4 items-center'}>
          <Button onClick={reset}>Try Again</Button>
          <Link href={ROUTES.AUTH.LOGIN}>
            <Button variant={BUTTON_VARIANT.secondary}>To main</Button>
          </Link>
        </div>

        <div className={'flex flex-row gap-2 mt-2'}>
          <p>Copy error text</p>
          <ButtonCopy copyText={error.message} />
        </div>
      </div>
    </Card>
  );
}
