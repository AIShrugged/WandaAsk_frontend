import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * H3 component.
 * @param className.children
 * @param className - className.
 * @param className.className
 */
export function H3({ children, className }: Props) {
  return (
    <h3 className={`text-xl font-semibold text-foreground ${className ?? ''}`}>
      {children}
    </h3>
  );
}
