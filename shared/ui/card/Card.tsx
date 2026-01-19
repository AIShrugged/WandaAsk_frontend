import clsx from 'clsx';

import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  className?: string;
}

export default function Card({ children, className = '' }: Props) {
  return (
    <div
      className={clsx('rounded-[40px] bg-white box-shadow-primary', className)}
    >
      {children}
    </div>
  );
}
