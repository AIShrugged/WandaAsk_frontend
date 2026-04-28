'use client';

import { useState } from 'react';

import { DecisionsPage } from '@/features/decisions/ui/decisions-page';

import type { DecisionSourceType } from '@/features/decisions/model/types';

const SOURCE_TABS: { key: DecisionSourceType | null; label: string }[] = [
  { key: null, label: 'All' },
  { key: 'meeting', label: 'From meetings' },
  { key: 'manual', label: 'Manual' },
];

interface Props {
  teamId: number;
}

export default function TeamDashboardTabDecisions({ teamId }: Props) {
  const [activeSource, setActiveSource] = useState<DecisionSourceType | null>(
    null,
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex gap-1 border-b border-border flex-shrink-0'>
        {SOURCE_TABS.map((tab) => {
          const isActive = tab.key === activeSource;

          return (
            <button
              key={String(tab.key)}
              type='button'
              onClick={() => {
                return setActiveSource(tab.key);
              }}
              className={[
                'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <DecisionsPage teamId={teamId} sourceTypeFilter={activeSource} />
    </div>
  );
}
