'use client';

import Link from 'next/link';
import { memo } from 'react';

import { IssuePriorityBadge } from '@/features/issues/ui/issue-priority-badge';
import {
  type KanbanCardItemProps,
  TYPE_COLORS,
} from '@/features/kanban/model/types';
import { getInitials } from '@/features/kanban/model/utils';
import { ROUTES } from '@/shared/lib/routes';
import Avatar from '@/shared/ui/common/avatar';

export const KanbanCardItem = memo(function KanbanCardItem({
  card,
  isMoving,
  onCardClick,
}: KanbanCardItemProps) {
  const typeClass =
    TYPE_COLORS[card.type] ?? 'bg-secondary text-secondary-foreground';

  return (
    <div
      draggable
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest('a') ?? target.closest('button')) return;
        onCardClick(card);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData('cardId', String(card.id));
        event.dataTransfer.setData('sourceStatus', card.status);
      }}
      className={[
        'group rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing transition-all',
        'border-border hover:border-primary/30 hover:shadow-[0_0_12px_rgba(124,58,237,0.12)]',
        isMoving ? 'opacity-60 pointer-events-none' : '',
      ].join(' ')}
    >
      <Link
        href={`${ROUTES.DASHBOARD.ISSUES}/${card.id}`}
        className='block text-sm font-medium text-foreground hover:text-primary leading-snug mb-2'
      >
        {card.name}
      </Link>
      {card.description ? (
        <p className='text-xs text-muted-foreground line-clamp-2 mb-3'>
          {card.description}
        </p>
      ) : null}
      {card.type ? (
        <div className='flex flex-wrap gap-1 mb-3'>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeClass}`}
          >
            {card.type}
          </span>
        </div>
      ) : null}
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        {card.assignee ? (
          <>
            <Avatar size='xs' className='text-[10px]'>
              {getInitials(card.assignee.name)}
            </Avatar>
            <span className='text-foreground truncate max-w-[120px]'>
              {card.assignee.name}
            </span>
          </>
        ) : null}
        <IssuePriorityBadge priority={card.priority} className='shrink-0' />
        <span className='ml-auto text-muted-foreground'>
          {new Date(card.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
});
