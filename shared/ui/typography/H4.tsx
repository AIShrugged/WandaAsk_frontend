import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H4({ children, className }: Props) {
  return (
    <h4
      className={`text-lg font-medium text-foreground ${className ?? ''}`}
    >
      {children}
    </h4>
  );
}
