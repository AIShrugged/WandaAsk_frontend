import type { PropsWithChildren } from 'react';

export default function ComponentHeader({ children }: PropsWithChildren) {
  return (
    <div className='flex items-center gap-[3] px-8 py-6 border-b-table'>
      {children}
    </div>
  );
}
