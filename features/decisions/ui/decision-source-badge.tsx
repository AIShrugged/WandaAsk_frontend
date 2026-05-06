import { BookOpen, Calendar, MessageSquare } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';

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
    className: 'bg-primary/10 text-violet-300',
  },
  chat: {
    icon: <MessageSquare className='w-3 h-3' />,
    label: 'Chat',
    className: 'bg-accent/15 text-emerald-400',
  },
};

interface Props {
  sourceType: DecisionSourceType;
}

export function DecisionSourceBadge({ sourceType }: Props) {
  const meta = META[sourceType] ?? META.manual;

  return (
    <Badge className={`gap-1 ${meta.className}`}>
      {meta.icon}
      {meta.label}
    </Badge>
  );
}
