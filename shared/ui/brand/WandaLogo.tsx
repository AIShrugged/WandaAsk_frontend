import clsx from 'clsx';

export function WandaLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {/* Green "W" placeholder — swap for real SVG when asset is available */}
      <div className='w-7 h-7 rounded-[var(--radius-button)] bg-primary flex items-center justify-center flex-shrink-0'>
        <span className='text-primary-foreground text-xs font-bold'>W</span>
      </div>
      <span className='font-semibold text-sm text-foreground'>WandaAsk</span>
    </div>
  );
}
