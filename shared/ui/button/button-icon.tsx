'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { ReactNode } from 'react';

type IconActionProps = {
  icon: ReactNode;
  href?: string;
  onClickAction?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'danger';
};

/**
 * ButtonIcon component.
 * @param root0
 * @param root0.icon
 * @param root0.href
 * @param root0.onClickAction
 * @param root0.disabled
 * @param root0.variant
 * @param root0.className
 */
export function ButtonIcon({
  icon,
  href,
  onClickAction,
  disabled = false,
  variant = 'primary',
  className,
}: IconActionProps) {
  const baseClasses =
    'cursor-pointer flex items-center justify-center transition-colors';

  const stateClasses = clsx(
    !disabled &&
      variant === 'primary' &&
      'text-muted-foreground hover:text-primary',
    !disabled &&
      variant === 'danger' &&
      'text-muted-foreground hover:text-destructive',
    disabled &&
      'text-muted-foreground/40 opacity-40 cursor-not-allowed pointer-events-none',
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
      onClick={disabled ? undefined : onClickAction}
      disabled={disabled}
      className={clsx(disabled && 'cursor-not-allowed')}
    >
      {content}
    </button>
  );
}
