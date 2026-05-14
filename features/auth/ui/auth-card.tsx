import { TribesLogo } from '@/shared/ui/brand';
import { Card } from '@/shared/ui/card';

import type { PropsWithChildren } from 'react';

interface AuthCardProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className='w-full max-w-[400px] auth-card-enter'>
      <div className='flex justify-center mb-8'>
        <TribesLogo />
      </div>

      <Card>
        <div className='px-8 py-10'>
          <div className='mb-8'>
            <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
            <p className='text-sm text-muted-foreground mt-1'>{subtitle}</p>
          </div>
          {children}
        </div>
      </Card>
    </div>
  );
}
