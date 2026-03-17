'use client';

import { createPortal } from 'react-dom';

import SpinLoader from '@/shared/ui/layout/spin-loader';

interface DemoOverlayProps {
  progressPercent: number | null;
  stepLabel: string | null;
}

/**
 * DemoOverlay — full-page progress overlay shown while demo data is being generated.
 * @param root0 - Component props.
 * @param root0.progressPercent - Current generation progress (0–100) or null while waiting.
 * @param root0.stepLabel - Current step description from the backend.
 * @returns Portal JSX element.
 */
export function DemoOverlay({ progressPercent, stepLabel }: DemoOverlayProps) {
  return createPortal(
    <div className='fixed inset-0 bg-background/70 backdrop-blur-sm z-[9999] flex items-center justify-center'>
      <div className='bg-card border border-border rounded-[var(--radius-card)] shadow-card p-6 flex flex-col gap-3 w-72'>
        {/* Title + percent */}
        <div className='flex items-center justify-between'>
          <p className='text-sm font-semibold text-foreground'>
            Generating demo
          </p>
          {progressPercent !== null && (
            <span className='text-sm font-bold text-primary tabular-nums'>
              {progressPercent}%
            </span>
          )}
        </div>

        {/* Progress bar or spinner */}
        {progressPercent === null ? (
          <div className='flex justify-center py-2'>
            <SpinLoader />
          </div>
        ) : (
          <div className='w-full bg-muted rounded-full h-1.5 overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-500 rounded-full'
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Step label or hint */}
        <p className='text-xs text-muted-foreground'>
          {stepLabel ?? 'This may take up to 10 minutes'}
        </p>
      </div>
    </div>,
    document.body,
  );
}
