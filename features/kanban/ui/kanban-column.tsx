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
        'flex flex-col w-[280px] shrink-0 rounded-[var(--r-xl)] border transition-colors self-start',
        isDragOver
          ? 'border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]'
          : 'border-[var(--border)] bg-[var(--surface-2)]',
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
      <div className='flex items-center justify-between px-[var(--sp-4)] py-[var(--sp-3)] border-b border-[var(--border)]'>
        <div className='flex items-center gap-2'>
          <span
            className='w-2 h-2 rounded-full flex-shrink-0'
            style={{ backgroundColor: color }}
          />
          <span className='text-[length:var(--fs-xs)] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]'>
            {label}
          </span>
        </div>
        <span className='text-[length:var(--fs-xs)] font-medium text-[var(--muted-foreground)] bg-[var(--secondary)] rounded-full px-2 py-0.5'>
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
