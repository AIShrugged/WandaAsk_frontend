import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H2({ children, className = '' }: Props) {
  return (
    <h2
      className={`text-2xl font-semibold tracking-tight text-foreground ${className}`}
    >
      {children}
    </h2>
  );
}
