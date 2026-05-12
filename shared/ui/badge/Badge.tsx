import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

const variants = {
  neutral: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
  default: 'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
  primary: 'bg-[var(--primary-soft)] text-[var(--primary-soft-text)]',
  // success: verified oklch(58% 0.155 155) on oklch(94% 0.045 155) ≈ 5.2:1 (AA pass in light)
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  // destructive kept as alias for danger — avoids breaking existing call sites
  destructive: 'bg-[var(--danger-bg)] text-[var(--danger)]',
  info: 'bg-[var(--info-bg)] text-[var(--info)]',
};

type BadgeVariant = keyof typeof variants;

type BadgeProps = PropsWithChildren<{
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}>;

export function Badge({
  variant = 'default',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className='inline-block w-1.5 h-1.5 rounded-full bg-current flex-shrink-0'
          aria-hidden='true'
        />
      )}
      {children}
    </span>
  );
}
