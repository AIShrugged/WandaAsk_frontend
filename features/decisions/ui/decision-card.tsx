import { UserCircle } from 'lucide-react';

import { DecisionSourceBadge } from '@/features/decisions/ui/decision-source-badge';

import type { Decision } from '@/features/decisions/model/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  decision: Decision;
}

export function DecisionCard({ decision }: Props) {
  const authorName = decision.author?.name ?? decision.author_raw_name ?? null;

  return (
    <div className='flex flex-col gap-2 p-4 bg-background border border-border rounded-[var(--radius-card)] hover:border-border/80 transition-colors'>
      {decision.topic && (
        <span className='text-xs font-semibold text-primary/80 uppercase tracking-wide'>
          {decision.topic}
        </span>
      )}
      <p className='text-sm text-foreground leading-relaxed'>{decision.text}</p>
      <div className='flex items-center gap-3 flex-wrap mt-1'>
        <DecisionSourceBadge sourceType={decision.source_type} />
        {authorName && (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <UserCircle className='w-3 h-3' />
            {authorName}
          </span>
        )}
        {decision.calendar_event && (
          <span className='text-xs text-muted-foreground truncate max-w-[240px]'>
            {decision.calendar_event.title}
          </span>
        )}
        <span className='text-xs text-muted-foreground ml-auto tabular-nums'>
          {formatDate(decision.created_at)}
        </span>
      </div>
    </div>
  );
}
