'use client';

import { useEffect } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/button/Button';
import Card from '@/shared/ui/card/Card';

interface ErrorPageProps {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <Card className='h-full flex flex-col items-center justify-center'>
      <div className='flex flex-col items-center gap-6 text-center px-8 py-6'>
        <div className='text-6xl'>⚠️</div>
        <h2 className='text-2xl font-semibold text-dark'>
          Something went wrong
        </h2>
        <p className='text-secondary max-w-md'>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className='flex gap-4'>
          <Button onClick={reset}>Try again</Button>
          <Button
            variant='secondary'
            onClick={() => (globalThis.location.href = ROUTES.DASHBOARD.CALENDAR)}
          >
            Go to Calendar
          </Button>
        </div>
        {error.digest && (
          <p className='text-xs text-tertiary'>Error ID: {error.digest}</p>
        )}
      </div>
    </Card>
  );
}
