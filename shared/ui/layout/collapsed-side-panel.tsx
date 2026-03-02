'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsedSidePanelProps {
  label: string;
  onExpand: () => void;
  /** Which chevron to show. 'right' (default) for left/center panels, 'left' for the rightmost panel. */
  icon?: 'left' | 'right';
  /** Border class(es) applied to the outer div. Defaults to 'border-r border-border'. */
  className?: string;
}

export function CollapsedSidePanel({
  label,
  onExpand,
  icon = 'right',
  className = 'border-r border-border',
}: CollapsedSidePanelProps) {
  const Icon = icon === 'right' ? ChevronRight : ChevronLeft;

  return (
    <div className={`w-10 flex-shrink-0 flex flex-col items-center justify-center bg-sidebar ${className}`}>
      <button
        onClick={onExpand}
        className='flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
        aria-label={`Expand ${label} panel`}
      >
        <Icon className='w-4 h-4' />
        <span
          className='text-xs font-medium tracking-wide'
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
