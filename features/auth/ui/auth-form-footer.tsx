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
 * @param root0 - Component props.
 * @param root0.primaryButton - Label for the primary submit button.
 * @param root0.primaryText - Link text for the secondary action.
 * @param root0.secondaryText - Descriptive text preceding the secondary link.
 * @param root0.secondaryRoute - Route for the secondary action link.
 * @param root0.formId - ID of the form this footer submits.
 * @param root0.loading - Whether the form is currently submitting.
 * @param root0.disabled - Disables the primary button when true.
 * @returns Result.
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
