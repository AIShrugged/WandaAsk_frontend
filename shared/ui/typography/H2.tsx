import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ className?: string }>;

/**
 * H2 component.
 * @param className.children
 * @param className - className.
 * @param className.className
 */
export function H2({ children, className = '' }: Props) {
  return (
    <h2
      className={`text-2xl font-semibold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h2>
  );
}
