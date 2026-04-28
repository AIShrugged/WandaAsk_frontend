import { BookOpen, Calendar, MessageSquare, UserCircle } from 'lucide-react';

import type {
  DecisionEntry,
  DecisionLogArtifact,
} from '@/entities/artifact/model/types';

const SOURCE_META: Record<
  DecisionEntry['source_type'],
  { icon: React.ReactNode; label: string; className: string }
> = {
  meeting: {
    icon: <Calendar className='w-3 h-3' />,
    label: 'Meeting',
    className: 'bg-blue-500/10 text-blue-400',
  },
  manual: {
    icon: <BookOpen className='w-3 h-3' />,
    label: 'Manual',
    className: 'bg-violet-500/10 text-violet-400',
  },
  chat: {
    icon: <MessageSquare className='w-3 h-3' />,
    label: 'Chat',
    className: 'bg-emerald-500/10 text-emerald-400',
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface DecisionItemProps {
  entry: DecisionEntry;
}

function DecisionItem({ entry }: DecisionItemProps) {
  const meta = SOURCE_META[entry.source_type];

  return (
    <div className='flex flex-col gap-1.5 py-3 border-b border-border/40 last:border-b-0'>
      {entry.topic && (
        <span className='text-xs font-semibold text-primary/80 uppercase tracking-wide'>
          {entry.topic}
        </span>
      )}
      <p className='text-sm text-foreground leading-relaxed'>{entry.text}</p>
      <div className='flex items-center gap-3 flex-wrap mt-0.5'>
        <span
          className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${meta.className}`}
        >
          {meta.icon}
          {meta.label}
        </span>
        {entry.author.name && (
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <UserCircle className='w-3 h-3' />
            {entry.author.name}
          </span>
        )}
        {entry.source_type === 'meeting' && entry.meeting && (
          <span className='text-xs text-muted-foreground truncate max-w-[200px]'>
            {entry.meeting.title}
          </span>
        )}
        <span className='text-xs text-muted-foreground ml-auto tabular-nums'>
          {formatDate(entry.created_at)}
        </span>
      </div>
    </div>
  );
}

export function DecisionLog({ data }: { data: DecisionLogArtifact['data'] }) {
  const decisions = data.decisions ?? [];

  if (decisions.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>
        No decisions found
        {data.query ? ` for "${data.query}"` : ''}
      </p>
    );
  }

  return (
    <div className='flex flex-col max-h-80 overflow-y-auto scrollbar-hide'>
      {data.query && (
        <p className='text-xs text-muted-foreground mb-2 pb-2 border-b border-border/40'>
          Results for &ldquo;{data.query}&rdquo; &middot; {data.team_name}
        </p>
      )}
      {decisions.map((entry) => {
        return <DecisionItem key={entry.id} entry={entry} />;
      })}
    </div>
  );
}
