import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface PillProps extends PropsWithChildren {
  className?: string;
  onClick?: () => void;
}

export function Pill({ children, className, onClick }: PillProps) {
  if (onClick) {
    return (
      <button
        type='button'
        onClick={onClick}
        className={clsx(
          'inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground',
          'cursor-pointer hover:bg-accent transition-colors',
          className,
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
