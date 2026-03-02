import Link from 'next/link';
import React from 'react';

import { Button } from '@/shared/ui/button/Button';

interface AuthActionsFooterProps {
  primaryButton: string;
  primaryText: string;
  secondaryText: string;
  secondaryRoute: string;
  formId: string;
  loading: boolean;
  disabled?: boolean;
}

export default function AuthFormFooter({
  primaryButton,
  primaryText,
  secondaryText,
  secondaryRoute,
  formId,
  loading,
  disabled,
}: AuthActionsFooterProps) {
  return (
    <div className='flex flex-col gap-4 mt-8'>
      <Button
        disabled={disabled ?? loading}
        loading={loading}
        type='submit'
        form={formId}
      >
        {primaryButton}
      </Button>

      <p className='text-sm text-center text-muted-foreground'>
        {secondaryText}{' '}
        <Link className='text-foreground font-medium hover:underline underline-offset-4' href={secondaryRoute}>
          {primaryText}
        </Link>
      </p>
    </div>
  );
}
