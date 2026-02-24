import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  className?: string;
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-card)] bg-card border border-border shadow-card',
        className,
      )}
    >
      {children}
    </div>
  );
}
