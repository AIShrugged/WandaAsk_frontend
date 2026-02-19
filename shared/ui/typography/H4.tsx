import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function H4({ children, className }: Props) {
  return (
    <div className={'max-w-full overflow-hidden'}>
      <h4
        style={{
          lineHeight: 'normal',
        }}
        className={`text-xl md:text-2xl lg:text-[28px] font-normal text-[#344137] font-inter  ${className}`}
      >
        {children}
      </h4>
    </div>
  );
}
