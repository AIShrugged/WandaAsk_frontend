import clsx from 'clsx';

import { BUTTON_VARIANT, type ButtonVariant } from '@/shared/types/button';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
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
  className,
  loading = false,
  disabled = false,
  type,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  const base =
    'relative h-10 w-full px-6 py-2 rounded-[var(--radius-button)] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2';

  const variants = {
    [BUTTON_VARIANT.primary]: clsx(
      'bg-gradient-to-b from-violet-500 to-violet-700 text-primary-foreground cursor-pointer',
      'border border-violet-400/20 border-t-violet-300/30',
      'shadow-[0_2px_12px_rgba(124,58,237,0.25)]',
      'hover:from-violet-400 hover:to-violet-600 hover:shadow-[0_4px_20px_rgba(124,58,237,0.5)]',
      'active:from-violet-600 active:to-violet-800 active:shadow-[0_1px_8px_rgba(124,58,237,0.3)]',
      isDisabled && 'opacity-50 cursor-not-allowed',
      loading && 'cursor-wait',
    ),
    [BUTTON_VARIANT.secondary]: clsx(
      'border border-input bg-background text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
      isDisabled && 'opacity-50 cursor-not-allowed',
      loading && 'cursor-wait',
    ),
    [BUTTON_VARIANT.danger]: clsx(
      'bg-destructive text-destructive-foreground cursor-pointer hover:bg-destructive/90 active:bg-destructive/80',
      isDisabled && 'opacity-50 cursor-not-allowed',
      loading && 'cursor-wait',
    ),
  };

  return (
    <button
      type={type}
      className={clsx(base, variants[variant], className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading ? <Loader text={loadingText} /> : children}
    </button>
  );
}
