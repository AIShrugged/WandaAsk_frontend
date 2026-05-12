import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

type CardVariant = 'default' | 'elevated' | 'flush';

interface Props extends PropsWithChildren {
  className?: string;
  variant?: CardVariant;
}

export default function Card({
  children,
  className = '',
  variant = 'default',
}: Props) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-card)] bg-card',
        variant === 'default' &&
          'shadow-[inset_0_0_0_1px_var(--border),var(--shadow-xs)]',
        variant === 'elevated' &&
          'shadow-[inset_0_0_0_1px_var(--border),var(--shadow-md)]',
        variant === 'flush' && 'border border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}
