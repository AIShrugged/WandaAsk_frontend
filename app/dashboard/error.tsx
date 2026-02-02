'use client';

import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import ButtonCopy from '@/shared/ui/button/button-copy';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { H2 } from '@/shared/ui/typography/H2';

interface ErrorPageProps {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <Card className='h-full flex flex-col items-center  overflow-y-scroll'>
      <CardBody>
        <div className={'flex flex-col justify-center'}>
          <AlertCircle className='h-12 w-12 text-destructive mb-4' />
          <H2>An error occurred</H2>
          <p>Please email (info@spodial.com) us the error</p>

          <Image
            alt={'error'}
            height={320}
            width={320}
            src={'/images/icons/error.png'}
          />

          <div className={'flex flex-row gap-2 mt-2'}>
            <p>Copy error text</p>
            <ButtonCopy copyText={error.message} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
