import type { PropsWithChildren } from 'react';

/**
 * ComponentHeader component.
 * @param props - Component props.
 * @param props.children
 */
export default function ComponentHeader({ children }: PropsWithChildren) {
  return (
    <div className='flex items-center gap-3 px-4 py-2 border-b border-border'>
      {children}
    </div>
  );
}
