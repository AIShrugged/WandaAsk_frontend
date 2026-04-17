'use client';

import { Archive, ChevronDown, ChevronUp } from 'lucide-react';

interface ArchivedSectionToggleProps {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * ArchivedSectionToggle renders the "Show archived (N)" / "Hide archived" button
 * displayed below the normal issues list.
 */
export function ArchivedSectionToggle({
  count,
  expanded,
  onToggle,
}: ArchivedSectionToggleProps) {
  return (
    <div className='flex items-center justify-center py-3'>
      <button
        type='button'
        onClick={onToggle}
        className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors select-none group'
      >
        <span className='flex-1 h-px bg-border/60 w-16 group-hover:bg-border transition-colors' />
        <Archive className='h-3.5 w-3.5' />
        {expanded ? (
          <>
            Hide archived
            <ChevronUp className='h-3.5 w-3.5' />
          </>
        ) : (
          <>
            Show archived ({count})
            <ChevronDown className='h-3.5 w-3.5' />
          </>
        )}
        <span className='flex-1 h-px bg-border/60 w-16 group-hover:bg-border transition-colors' />
      </button>
    </div>
  );
}
