'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CollapsibleSectionProps {
  label: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  label,
  defaultExpanded = true,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className='flex flex-col gap-2 '>
      <button
        onClick={() => {
          return setIsExpanded((v) => {
            return !v;
          });
        }}
        className='cursor-pointer flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors'
      >
        <span className={'text-md text-primary'}>{label}</span>
        {isExpanded ? (
          <ChevronUp className='h-3 w-3' />
        ) : (
          <ChevronDown className='h-3 w-3' />
        )}
      </button>

      {isExpanded && children}
    </div>
  );
}
