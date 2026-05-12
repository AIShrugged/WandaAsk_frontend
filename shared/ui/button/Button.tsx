import clsx from 'clsx';

import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
  type ButtonSize,
  type ButtonVariant,
} from '@/shared/types/button';

import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';

interface Props
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  justify?: 'center' | 'start' | 'end';
  className?: string;
}

const Loader = ({ text }: { text: string }) => {
  return (
    <div className='flex items-center justify-center gap-2'>
      <div className='animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent' />
      <p>{text}</p>
    </div>
  );
};

// Focus ring applied to all variants via base class
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]';

export function Button({
  loadingText = 'Please wait',
  children,
  variant = BUTTON_VARIANT.primary,
  size = BUTTON_SIZE.md,
  fullWidth = true,
  justify = 'center',
  leftIcon,
  rightIcon,
  className,
  loading = false,
  disabled = false,
  type,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : null;
  const loadingClass = loading ? 'cursor-wait' : null;

  const justifyClass = {
    center: 'justify-center',
    start: 'justify-start',
    end: 'justify-end',
  };

  const base = clsx(
    'relative rounded-[var(--radius-button)] font-medium text-sm transition-all duration-200 flex items-center gap-2',
    focusRing,
    fullWidth ? 'w-full' : 'w-auto',
    justifyClass[justify],
  );

  const sizes = {
    [BUTTON_SIZE.xs]: 'h-6 px-2.5 py-1 text-xs',
    [BUTTON_SIZE.sm]: 'h-[30px] px-3.5 py-1',
    [BUTTON_SIZE.md]: 'h-9 px-5 py-2',
    [BUTTON_SIZE.lg]: 'h-[42px] px-6 py-2.5 text-base',
  };

  const variants = {
    [BUTTON_VARIANT.primary]: clsx(
      'bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer',
      'shadow-[inset_0_0_0_1px_oklch(54%_0.200_271),inset_0_-2px_0_oklch(36%_0.180_268)]',
      'hover:bg-[var(--primary-hover)]',
      'active:translate-y-px active:shadow-[inset_0_0_0_1px_oklch(54%_0.200_271)]',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.secondary]: clsx(
      'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] cursor-pointer',
      'hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
      'active:bg-[var(--secondary)]',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.danger]: clsx(
      'bg-destructive text-destructive-foreground cursor-pointer',
      'hover:bg-destructive/90 active:bg-destructive/80',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.ghostDanger]: clsx(
      'border border-destructive/50 bg-transparent text-destructive cursor-pointer',
      'hover:bg-[var(--danger-bg)] hover:border-destructive',
      'active:bg-destructive/10',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.ghost]: clsx(
      'bg-transparent text-[var(--foreground)] cursor-pointer',
      'hover:bg-[var(--secondary)]',
      'active:bg-[var(--secondary)]',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.pill]: clsx(
      'rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] cursor-pointer',
      'hover:border-[var(--primary)] hover:text-[var(--foreground)]',
      disabledClass,
      loadingClass,
    ),
  };

  return (
    <button
      type={type}
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <Loader text={loadingText} />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}
