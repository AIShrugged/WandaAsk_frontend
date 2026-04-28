import { BookOpen, Calendar, MessageSquare } from 'lucide-react';

import type { DecisionSourceType } from '@/features/decisions/model/types';

const META: Record<
  DecisionSourceType,
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

interface Props {
  sourceType: DecisionSourceType;
}

export function DecisionSourceBadge({ sourceType }: Props) {
  const meta = META[sourceType] ?? META.manual;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium ${meta.className}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}
