'use client';

import clsx from 'clsx';
import Link from 'next/link';

import type { ReactNode } from 'react';

type ButtonIconSize = 'sm' | 'md' | 'lg';

type IconActionProps = {
  icon: ReactNode;
  'aria-label': string;
  href?: string;
  onClickAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonIconSize;
  className?: string;
  variant?: 'primary' | 'danger' | 'ghost';
};

const sizeClass: Record<ButtonIconSize, string> = {
  sm: 'size-5',
  md: 'size-7',
  lg: 'size-8',
};

export function ButtonIcon({
  icon,
  'aria-label': ariaLabel,
  href,
  onClickAction,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'primary',
  className,
}: IconActionProps) {
  const isDisabled = disabled || loading;

  const baseClasses = clsx(
    'cursor-pointer flex items-center justify-center transition-colors',
    sizeClass[size],
  );

  const stateClasses = clsx(
    !isDisabled &&
      variant === 'primary' &&
      'text-muted-foreground hover:text-primary hover:drop-shadow-[0_0_6px_rgba(124,58,237,0.7)]',
    !isDisabled &&
      variant === 'danger' &&
      'text-muted-foreground hover:text-destructive',
    !isDisabled &&
      variant === 'ghost' &&
      'text-muted-foreground hover:text-foreground hover:bg-accent rounded-md',
    isDisabled &&
      'text-muted-foreground/40 opacity-40 cursor-not-allowed pointer-events-none',
  );

  const content = (
    <span className={clsx(baseClasses, stateClasses, className)}>
      {loading ? (
        <div className='animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent' />
      ) : (
        icon
      )}
    </span>
  );

  if (href && !isDisabled) {
    return (
      <Link href={href} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type='button'
      aria-label={ariaLabel}
      onClick={isDisabled ? undefined : onClickAction}
      disabled={isDisabled}
      className={clsx(isDisabled && 'cursor-not-allowed')}
    >
      {content}
    </button>
  );
}
