import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}
export function H3({ children, className }: Props) {
  return (
    <h1 className={`text-[20px] text-accent font-bold ${className}`}>
      {children}
    </h1>
  );
}
