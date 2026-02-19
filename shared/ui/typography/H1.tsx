import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: Props) {
  return (
    <h1
      className={`text-4xl md:text-5xl lg:text-[64px] font-normal leading-normal text-[#344137] font-inter ${className}`}
    >
      {children}
    </h1>
  );
}
