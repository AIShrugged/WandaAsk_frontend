import type { PropsWithChildren } from 'react';

/**
 * ComponentCard component.
 * @param props - Component props.
 * @param props.children
 */
export default function ComponentCard({ children }: PropsWithChildren) {
  return (
    <div className='bg-muted/50 border border-border rounded-[var(--radius-card)] p-4 flex flex-col justify-between'>
      {children}
    </div>
  );
}
