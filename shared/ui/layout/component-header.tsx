import type { PropsWithChildren } from 'react';

export default function ComponentHeader({ children }: PropsWithChildren) {
  return (
    <div className='flex items-center gap-3 px-6 py-4 border-b border-border'>
      {children}
    </div>
  );
}
