import { Loader2 } from 'lucide-react';

/**
 * Loading component.
 */
export default function Loading() {
  return (
    <div className='flex h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card items-center justify-center'>
      <Loader2 className='w-6 h-6 text-primary animate-spin' />
    </div>
  );
}
