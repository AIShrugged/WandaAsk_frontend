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
      <div className='animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent' />
      <p>{text}</p>
    </div>
  );
};

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
    fullWidth ? 'w-full' : 'w-auto',
    justifyClass[justify],
  );

  const sizes = {
    [BUTTON_SIZE.xs]: 'h-7 px-2.5 py-1 text-xs',
    [BUTTON_SIZE.sm]: 'h-9 px-4 py-1.5',
    [BUTTON_SIZE.md]: 'h-10 px-6 py-2',
  };

  const variants = {
    [BUTTON_VARIANT.primary]: clsx(
      'bg-gradient-to-b from-violet-500 to-violet-700 text-primary-foreground cursor-pointer',
      'border border-violet-400/20 border-t-violet-300/30',
      'shadow-[0_2px_12px_rgba(124,58,237,0.25)]',
      'hover:from-violet-400 hover:to-violet-600 hover:shadow-[0_4px_20px_rgba(124,58,237,0.5)]',
      'active:from-violet-600 active:to-violet-800 active:shadow-[0_1px_8px_rgba(124,58,237,0.3)]',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.secondary]: clsx(
      'border border-input bg-background text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.danger]: clsx(
      'bg-destructive text-destructive-foreground cursor-pointer hover:bg-destructive/90 active:bg-destructive/80',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.ghostDanger]: clsx(
      'border border-destructive/50 bg-background text-destructive cursor-pointer hover:bg-destructive hover:text-destructive-foreground active:bg-destructive/90',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.ghost]: clsx(
      'bg-transparent text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
      disabledClass,
      loadingClass,
    ),
    [BUTTON_VARIANT.pill]: clsx(
      'rounded-full border border-border bg-background text-muted-foreground cursor-pointer',
      'hover:border-primary/40 hover:text-foreground',
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
