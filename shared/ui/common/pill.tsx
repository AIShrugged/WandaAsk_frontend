import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

interface PillProps extends PropsWithChildren {
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

const base =
  'inline-flex items-center rounded-full h-7 px-3 text-sm transition-shadow';

const inactive = clsx(
  'bg-[var(--background)] text-[var(--text-muted-color,var(--muted-foreground))]',
  'shadow-[inset_0_0_0_1px_var(--border)]',
  'hover:shadow-[inset_0_0_0_1px_var(--border-strong)] hover:text-[var(--foreground)]',
);

const activeStyle = clsx(
  'bg-[var(--primary)] text-[var(--primary-foreground)]',
  'shadow-[inset_0_0_0_1px_var(--primary)]',
);

export function Pill({
  children,
  className,
  onClick,
  active = false,
}: PillProps) {
  const variantClass = active ? activeStyle : inactive;

  if (onClick) {
    return (
      <button
        type='button'
        aria-pressed={active}
        onClick={onClick}
        className={clsx(
          base,
          variantClass,
          'cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={clsx(base, variantClass, className)}>{children}</span>
  );
}
