import clsx from 'clsx';

import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
  type ButtonSize,
  type ButtonVariant,
} from '@/shared/types/button';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
  loadingText?: string;
}

/**
 * Loader component.
 * @param props - Component props.
 * @param props.text
 */
const Loader = ({ text }: { text: string }) => {
  return (
    <div className='flex items-center justify-center gap-2'>
      <div className='animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent' />
      <p>{text}</p>
    </div>
  );
};

/**
 * Button component.
 * @param root0
 * @param root0.loadingText
 * @param root0.children
 * @param root0.variant
 * @param root0.className
 * @param root0.loading
 * @param root0.disabled
 * @param root0.type
 */
export function Button({
  loadingText = 'Please wait',
  children,
  variant = BUTTON_VARIANT.primary,
  size = BUTTON_SIZE.md,
  className,
  loading = false,
  disabled = false,
  type,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : null;
  const loadingClass = loading ? 'cursor-wait' : null;
  const base =
    'relative w-full rounded-[var(--radius-button)] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2';
  const sizes = {
    [BUTTON_SIZE.md]: 'h-10 px-6 py-2',
    [BUTTON_SIZE.sm]: 'h-9 px-4 py-1.5',
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
  };

  return (
    <button
      type={type}
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading ? <Loader text={loadingText} /> : children}
    </button>
  );
}
