'use client';

import { memo, useState } from 'react';

import {
  type IssueStatus,
  type KanbanColumnProps,
} from '@/features/kanban/model/types';
import { KanbanCardItem } from '@/features/kanban/ui/kanban-card-item';

export const KanbanColumn = memo(function KanbanColumn({
  id,
  label,
  color,
  cards,
  onDrop,
  onMoveToColumn,
  movingCardId,
  onCardClick,
  footer,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={[
        'flex flex-col w-[calc(25%-9px)] min-w-[200px] shrink-0 rounded-xl border transition-colors self-start',
        isDragOver
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card/50',
      ].join(' ')}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        const cardId = Number(event.dataTransfer.getData('cardId'));
        const sourceStatus = event.dataTransfer.getData(
          'sourceStatus',
        ) as IssueStatus;
        if (!Number.isNaN(cardId) && sourceStatus !== id) {
          onDrop(cardId, sourceStatus, id);
        }
      }}
    >
      <div className='flex items-center justify-between px-3 py-2.5 border-b border-border/60'>
        <div className='flex items-center gap-2'>
          <span
            className='w-2 h-2 rounded-full flex-shrink-0'
            style={{ backgroundColor: color }}
          />
          <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            {label}
          </span>
        </div>
        <span className='text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5'>
          {cards.length}
        </span>
      </div>

      <div className='flex flex-col gap-2 p-2 min-h-[120px]'>
        {cards.map((card) => {
          return (
            <KanbanCardItem
              key={card.id}
              card={card}
              onMoveToColumn={onMoveToColumn}
              isMoving={movingCardId === card.id}
              onCardClick={onCardClick}
            />
          );
        })}
        {cards.length === 0 ? (
          <div className='flex items-center justify-center h-20 text-xs text-muted-foreground select-none'>
            Drop cards here
          </div>
        ) : null}
      </div>

      {footer}
    </div>
  );
});
