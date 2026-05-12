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
    [BUTTON_SIZE.xs]: 'h-6 px-2.5 py-1 text-xs',
    [BUTTON_SIZE.sm]: 'h-[30px] px-3.5 py-1',
    [BUTTON_SIZE.md]: 'h-9 px-5 py-2',
    [BUTTON_SIZE.lg]: 'h-[42px] px-6 py-2.5 text-base',
  };

  const variants = {
    [BUTTON_VARIANT.primary]: clsx(
      'bg-[var(--primary)] text-[var(--primary-foreground)]',
      'shadow-[inset_0_0_0_1px_oklch(54%_0.200_271),inset_0_-2px_0_oklch(36%_0.180_268)]',
      'hover:bg-[var(--primary-hover)]',
      'active:translate-y-px active:shadow-[inset_0_0_0_1px_oklch(54%_0.200_271)]',
    ),
    [BUTTON_VARIANT.secondary]: clsx(
      'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]',
      'hover:bg-[var(--secondary)] active:bg-[var(--secondary)]',
    ),
    [BUTTON_VARIANT.danger]: clsx(
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
    ),
    [BUTTON_VARIANT.ghostDanger]: clsx(
      'border border-destructive/50 bg-transparent text-destructive',
      'hover:bg-[var(--danger-bg)] hover:border-destructive active:bg-destructive/10',
    ),
    [BUTTON_VARIANT.ghost]: clsx(
      'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] active:bg-[var(--secondary)]',
    ),
    [BUTTON_VARIANT.pill]: clsx(
      'rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]',
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
