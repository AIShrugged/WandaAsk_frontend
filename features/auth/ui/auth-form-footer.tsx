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

/**
 * AuthFormFooter component.
 * @param root0
 * @param root0.primaryButton
 * @param root0.primaryText
 * @param root0.secondaryText
 * @param root0.secondaryRoute
 * @param root0.formId
 * @param root0.loading
 * @param root0.disabled
 */
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
        <Link
          className='cursor-pointer text-foreground font-medium hover:underline underline-offset-4'
          href={secondaryRoute}
        >
          {primaryText}
        </Link>
      </p>
    </div>
  );
}
