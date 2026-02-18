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
    <div className={'flex flex-col gap-6 mt-12'}>
      <Button
        disabled={disabled ?? loading}
        loading={loading}
        type={'submit'}
        form={formId}
      >
        {primaryButton}
      </Button>

      <div className={'flex gap-1'}>
        <p>{secondaryText}</p>
        <Link className={'text-accent font-bold'} href={secondaryRoute}>
          {primaryText}
        </Link>
      </div>
    </div>
  );
}
