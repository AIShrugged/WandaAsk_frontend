import clsx from 'clsx';

import { APP_NAME } from '@/shared/lib/app-name';

/**
 * TribesLogo component.
 * @param props - Component props.
 * @param props.className
 */
export function TribesLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className='w-7 h-7 rounded-[var(--radius-button)] bg-primary flex items-center justify-center flex-shrink-0'>
        <span className='text-primary-foreground text-xs font-bold'>T</span>
      </div>
      <span className='font-bold text-sm uppercase text-foreground'>
        {APP_NAME}
      </span>
    </div>
  );
}
