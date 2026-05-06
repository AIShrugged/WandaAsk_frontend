import clsx from 'clsx';
import Link from 'next/link';

import {
  BUTTON_SIZE,
  BUTTON_VARIANT,
  type ButtonSize,
  type ButtonVariant,
} from '@/shared/types/button';

import type { PropsWithChildren, ReactNode } from 'react';

type ButtonLinkProps = PropsWithChildren<{
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  external?: boolean;
}>;

export function ButtonLink({
  href,
  children,
  variant = BUTTON_VARIANT.primary,
  size = BUTTON_SIZE.md,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  target,
  rel,
  external = false,
}: ButtonLinkProps) {
  const resolvedTarget = external ? '_blank' : target;
  const resolvedRel = external ? 'noopener noreferrer' : rel;

  const base = clsx(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium text-sm transition-all duration-200 no-underline',
    fullWidth ? 'w-full' : 'w-auto',
  );

  const sizes = {
    [BUTTON_SIZE.xs]: 'h-7 px-2.5 py-1 text-xs',
    [BUTTON_SIZE.sm]: 'h-9 px-4 py-1.5',
    [BUTTON_SIZE.md]: 'h-10 px-6 py-2',
  };

  const variants = {
    [BUTTON_VARIANT.primary]: clsx(
      'bg-gradient-to-b from-violet-500 to-violet-700 text-primary-foreground',
      'border border-violet-400/20 border-t-violet-300/30',
      'shadow-[0_2px_12px_rgba(124,58,237,0.25)]',
      'hover:from-violet-400 hover:to-violet-600 hover:shadow-[0_4px_20px_rgba(124,58,237,0.5)]',
      'active:from-violet-600 active:to-violet-800 active:shadow-[0_1px_8px_rgba(124,58,237,0.3)]',
    ),
    [BUTTON_VARIANT.secondary]: clsx(
      'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
    ),
    [BUTTON_VARIANT.danger]: clsx(
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
    ),
    [BUTTON_VARIANT.ghostDanger]: clsx(
      'border border-destructive/50 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground active:bg-destructive/90',
    ),
    [BUTTON_VARIANT.ghost]: clsx(
      'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
    ),
    [BUTTON_VARIANT.pill]: clsx(
      'rounded-full border border-border bg-background text-muted-foreground',
      'hover:border-primary/40 hover:text-foreground',
    ),
  };

  return (
    <Link
      href={href}
      target={resolvedTarget}
      rel={resolvedRel}
      className={clsx(base, sizes[size], variants[variant], className)}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
