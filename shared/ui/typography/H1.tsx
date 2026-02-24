import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: Props) {
  return (
    <h1
      className={`text-3xl font-bold tracking-tight text-foreground ${className ?? ''}`}
    >
      {children}
    </h1>
  );
}
