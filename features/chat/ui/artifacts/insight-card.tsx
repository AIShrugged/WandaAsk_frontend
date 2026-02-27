import { Brain, Target, Zap } from 'lucide-react';

import type { InsightCardArtifact } from '@/features/chat/types';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  communication: {
    label: 'Communication',
    icon: <Brain className='w-3.5 h-3.5' />,
  },
  strengths: {
    label: 'Strengths',
    icon: <Zap className='w-3.5 h-3.5' />,
  },
  focus_areas: {
    label: 'Focus areas',
    icon: <Target className='w-3.5 h-3.5' />,
  },
};

function InsightSection({
  category,
  content,
}: {
  category: string;
  content: Record<string, unknown>;
}) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: null };

  const note = content['note'] as string | undefined;
  const items = content['items'] as string[] | undefined;

  return (
    <div className='flex flex-col gap-1.5'>
      <p className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground'>
        {meta.icon}
        {meta.label}
      </p>

      {note && (
        <p className='text-sm text-foreground bg-accent/40 rounded-[var(--radius-button)] px-3 py-2'>
          {note}
        </p>
      )}

      {items && items.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {items.map((item, i) => (
            <span
              key={i}
              className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary'
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function InsightCard({ data }: { data: InsightCardArtifact['data'] }) {
  const insights = data.insights ?? [];

  return (
    <div className='flex flex-col gap-4'>
      {data.person && (
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary'>
            {data.person.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <p className='text-sm font-semibold text-foreground'>{data.person.name}</p>
        </div>
      )}

      {insights.map((insight, i) => (
        <InsightSection
          key={i}
          category={insight.category}
          content={insight.content}
        />
      ))}
    </div>
  );
}
