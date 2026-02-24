import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H3({ children, className }: Props) {
  return (
    <h3 className={`text-xl font-semibold text-foreground ${className ?? ''}`}>
      {children}
    </h3>
  );
}
