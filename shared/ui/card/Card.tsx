import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  className?: string;
}

/**
 * Card component.
 * @param className.children
 * @param className - className.
 * @param className.className
 */
export default function Card({ children, className = '' }: Props) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-card)] bg-card border border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}
