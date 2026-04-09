import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * H1 component.
 * @param className.children
 * @param className - className.
 * @param className.className
 */
export function H1({ children, className }: Props) {
  return (
    <h1
      className={`text-3xl font-bold tracking-tight text-foreground ${className ?? ''}`}
    >
      {children}
    </h1>
  );
}
