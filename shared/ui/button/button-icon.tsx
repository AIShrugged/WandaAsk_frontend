'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { ReactNode } from 'react';

type IconActionProps = {
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'danger';
};

export function ButtonIcon({
  icon,
  href,
  onClick,
  disabled = false,
  variant = 'primary',
  className,
}: IconActionProps) {
  const baseClasses = 'flex items-center justify-center transition-colors';

  const stateClasses = clsx(
    !disabled && variant === 'primary' && 'text-secondary hover:text-primary',
    !disabled && variant === 'danger' && 'text-secondary hover:text-error',
    disabled && 'text-muted opacity-40 cursor-not-allowed pointer-events-none',
  );

  const content = (
    <span className={clsx(baseClasses, stateClasses, className)}>{icon}</span>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button
      type='button'
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={clsx(disabled && 'cursor-not-allowed')}
    >
      {content}
    </button>
  );
}
