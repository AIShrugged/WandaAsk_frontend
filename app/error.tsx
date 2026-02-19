'use client';

import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
    <Card className={'overflow-y-scroll h-screen'}>
      <div className='flex flex-col items-center justify-center text-center p-4'>
        <AlertCircle className='h-12 w-12 text-destructive mb-4' />
        <H2>An error occurred</H2>
        <p>Please email (info@spodial.com) us the error</p>

        <Image
          alt={'error'}
          height={320}
          width={320}
          src={'/images/icons/error.png'}
          sizes='(max-width: 640px) 240px, 320px'
        />

        <div className={'flex flex-row gap-2 mt-2'}>
          <p>Copy error text</p>
          <ButtonCopy copyText={error.message} />
        </div>
      </div>
    </Card>
  );
}
