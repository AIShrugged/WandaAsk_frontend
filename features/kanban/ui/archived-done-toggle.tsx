'use client';

import { Archive } from 'lucide-react';

import SpinLoader from '@/shared/ui/layout/spin-loader';

interface ArchivedDoneToggleProps {
  count: number | null;
  expanded: boolean;
  loading: boolean;
  onToggle: () => void;
}

/**
 * ArchivedDoneToggle renders a compact "Show archived (N)" toggle inside the Done column.
 */
export function ArchivedDoneToggle({
  count,
  expanded,
  loading,
  onToggle,
}: ArchivedDoneToggleProps) {
  if (loading && count === null) {
    return (
      <div className='flex justify-center py-2'>
        <SpinLoader />
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <div className='px-2 py-1.5 border-t border-dashed border-border/50'>
      <button
        type='button'
        onClick={onToggle}
        className='flex items-center gap-1.5 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors'
      >
        <Archive className='h-3 w-3 flex-shrink-0' />
        {expanded ? (
          <span>Hide archived</span>
        ) : (
          <span>Show archived{count === null ? '' : ` (${count})`}</span>
        )}
      </button>
    </div>
  );
}
