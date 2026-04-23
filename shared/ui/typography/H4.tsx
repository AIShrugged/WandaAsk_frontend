import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ className?: string }>;

/**
 * H4 component.
 * @param className.children
 * @param className - className.
 * @param className.className
 */
export function H4({ children, className }: Props) {
  return (
    <h4 className={`text-lg font-medium text-foreground ${className ?? ''}`}>
      {children}
    </h4>
  );
}
