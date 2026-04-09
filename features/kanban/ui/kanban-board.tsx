'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUp,
  Calendar,
  ExternalLink,
  MessageSquare,
  Minus,
  Paperclip,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { moveKanbanCard } from '@/features/kanban/api/kanban';
import {
  KANBAN_COLUMNS,
  type IssueStatus,
  type KanbanCard,
  type KanbanPriority,
} from '@/features/kanban/model/types';
import { ROUTES } from '@/shared/lib/routes';
import Avatar from '@/shared/ui/common/avatar';

import type { OrganizationProps } from '@/entities/organization';
import type {
  PersonOption,
  SharedFilters,
} from '@/features/issues/model/types';

interface KanbanBoardProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  filters: SharedFilters;
  columnsVersion: number;
}

/**
 * priorityIcon renders priority indicator icon.
 * @param priority - card priority.
 * @param priority.priority
 * @returns JSX element.
 */
function PriorityIcon({ priority }: { priority: KanbanPriority }) {
  if (priority === 'critical') {
    return <AlertTriangle className='h-3 w-3 text-red-400' />;
  }

  if (priority === 'high') {
    return <ArrowUp className='h-3 w-3 text-orange-400' />;
  }

  return <Minus className='h-3 w-3 text-muted-foreground' />;
}

/**
 * getInitials returns up to 2 initials from a name string.
 * @param name - person name.
 * @returns initials string.
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => {
      return part[0] ?? '';
    })
    .join('')
    .toUpperCase();
}

/**
 * TaskPreviewModal shows a detailed modal preview of a clicked kanban card.
 * @param props - component props.
 * @param props.card - card to preview, or null when none is selected.
 * @param props.onClose - called to close the modal.
 */
function TaskPreviewModal({
  card,
  onClose,
}: {
  card: KanbanCard | null;
  onClose: () => void;
}) {
  const priorityConfig: Record<
    KanbanPriority,
    { label: string; color: string }
  > = {
    critical: { label: 'Critical', color: 'text-red-400' },
    high: { label: 'High', color: 'text-orange-400' },
    medium: { label: 'Medium', color: 'text-yellow-400' },
    low: { label: 'Low', color: 'text-muted-foreground' },
  };
  const typeColors: Record<string, string> = {
    development: 'bg-blue-500/20 text-blue-300',
    organization: 'bg-purple-500/20 text-purple-300',
  };
  const colConfig = card
    ? (KANBAN_COLUMNS.find((col) => {
        return col.id === card.status;
      }) ?? KANBAN_COLUMNS[0])
    : null;

  return (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40'
          />

          {/* Modal */}
          <div className='fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='bg-card rounded-xl border border-border shadow-lg w-full max-w-md max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col'
            >
              {/* Header */}
              <div className='px-4 py-3 border-b border-border/60 flex items-center gap-2'>
                {colConfig ? (
                  <span
                    className='w-2 h-2 rounded-full flex-shrink-0'
                    style={{ backgroundColor: colConfig.color }}
                  />
                ) : null}
                <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate'>
                  {colConfig?.label}
                </span>
                <span className='text-xs text-muted-foreground/60 font-mono flex-shrink-0'>
                  #{card.id}
                </span>
                <button
                  type='button'
                  onClick={onClose}
                  className='ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors'
                  aria-label='Close preview'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              {/* Body */}
              <div className='flex-1 overflow-y-auto p-4 flex flex-col gap-3'>
                {/* Title */}
                <p className='text-sm font-semibold text-foreground leading-snug'>
                  {card.name}
                </p>

                {/* Type badge */}
                {card.type ? (
                  <span
                    className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[card.type] ?? 'bg-secondary text-secondary-foreground'}`}
                  >
                    {card.type}
                  </span>
                ) : null}

                {/* Description */}
                {card.description ? (
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    {card.description}
                  </p>
                ) : (
                  <p className='text-xs text-muted-foreground/40 italic'>
                    No description
                  </p>
                )}

                {/* Meta grid */}
                <div className='flex flex-col gap-2 pt-1'>
                  {/* Priority */}
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground/60'>Priority</span>
                    <span
                      className={`font-medium ${priorityConfig[card.priority ?? 'low'].color}`}
                    >
                      {priorityConfig[card.priority ?? 'low'].label}
                    </span>
                  </div>

                  {/* Story points */}
                  {card.story_points !== null &&
                  card.story_points !== undefined ? (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground/60'>
                        Story points
                      </span>
                      <span className='font-medium text-foreground'>
                        {card.story_points}
                      </span>
                    </div>
                  ) : null}

                  {/* Assignee */}
                  {card.assignee ? (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground/60'>Assignee</span>
                      <span className='font-medium text-foreground truncate max-w-[200px]'>
                        {card.assignee.name}
                      </span>
                    </div>
                  ) : null}

                  {/* Created date */}
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground/60'>Created</span>
                    <span className='flex items-center gap-1 text-muted-foreground'>
                      <Calendar className='h-3 w-3' />
                      {new Date(card.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Attachments / comments */}
                {card.attachments_count > 0 || card.comments_count > 0 ? (
                  <div className='flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40'>
                    {card.attachments_count > 0 ? (
                      <span className='flex items-center gap-1'>
                        <Paperclip className='h-3 w-3' />
                        {card.attachments_count}
                      </span>
                    ) : null}
                    {card.comments_count > 0 ? (
                      <span className='flex items-center gap-1'>
                        <MessageSquare className='h-3 w-3' />
                        {card.comments_count}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Open link */}
              <div className='px-4 py-3 border-t border-border/60'>
                <Link
                  href={`${ROUTES.DASHBOARD.ISSUES}/${card.id}`}
                  className='flex items-center justify-center gap-1.5 w-full h-7 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors'
                >
                  <ExternalLink className='h-3 w-3' />
                  Open issue
                </Link>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * KanbanCardItem renders a single card in a column.
 * @param props - card props.
 * @param props.card - kanban card.
 * @param props.onMoveToColumn - move card handler.
 * @param props.columns - available target columns.
 * @param props.isMoving - whether card is being moved.
 * @param props.onCardClick - called with card when clicked to show preview.
 */
function KanbanCardItem({
  card,
  onMoveToColumn,
  columns,
  isMoving,
  onCardClick,
}: {
  card: KanbanCard;
  onMoveToColumn: (card: KanbanCard, status: IssueStatus) => void;
  columns: typeof KANBAN_COLUMNS;
  isMoving: boolean;
  onCardClick: (card: KanbanCard) => void;
}) {
  const [dragOver] = useState(false);
  const typeColors: Record<string, string> = {
    development: 'bg-blue-500/20 text-blue-300',
    organization: 'bg-purple-500/20 text-purple-300',
  };
  const typeClass =
    typeColors[card.type] ?? 'bg-secondary text-secondary-foreground';
  const otherColumns = columns.filter((col) => {
    return col.id !== card.status;
  });

  return (
    <div
      draggable
      onClick={(event) => {
        // Don't open preview when clicking the title link or move buttons
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
        dragOver ? 'opacity-50' : '',
        isMoving ? 'opacity-60 pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Card title */}
      <Link
        href={`${ROUTES.DASHBOARD.ISSUES}/${card.id}`}
        className='block text-sm font-medium text-foreground hover:text-primary leading-snug mb-2'
      >
        {card.name}
      </Link>

      {/* Description preview (2 lines max) */}
      {card.description ? (
        <p className='text-xs text-muted-foreground line-clamp-2 mb-3'>
          {card.description}
        </p>
      ) : null}

      {/* Tags */}
      {card.type ? (
        <div className='flex flex-wrap gap-1 mb-3'>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeClass}`}
          >
            {card.type}
          </span>
        </div>
      ) : null}

      {/* Footer row: Avatar + assignee + created_date */}
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
        <span className='ml-auto text-muted-foreground/60'>
          {new Date(card.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Quick move actions — appear on hover */}
      {otherColumns.length > 0 ? (
        <div className='mt-2 hidden group-hover:flex flex-wrap gap-1'>
          {otherColumns.map((col) => {
            return (
              <button
                key={col.id}
                type='button'
                onClick={() => {
                  onMoveToColumn(card, col.id);
                }}
                disabled={isMoving}
                className='text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors'
              >
                → {col.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * KanbanColumn renders a single status column with drop support.
 * @param props - column props.
 * @param props.id - column status id.
 * @param props.label - column label.
 * @param props.color - column indicator color.
 * @param props.cards - cards in column.
 * @param props.onDrop - drop handler.
 * @param props.onMoveToColumn - move handler.
 * @param props.movingCardId - id of card being moved.
 * @param props.onCardClick
 */
function KanbanColumnComponent({
  id,
  label,
  color,
  cards,
  onDrop,
  onMoveToColumn,
  movingCardId,
  onCardClick,
}: {
  id: IssueStatus;
  label: string;
  color: string;
  cards: KanbanCard[];
  onDrop: (
    cardId: number,
    sourceStatus: IssueStatus,
    targetStatus: IssueStatus,
  ) => void;
  onMoveToColumn: (card: KanbanCard, status: IssueStatus) => void;
  movingCardId: number | null;
  onCardClick: (card: KanbanCard) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={[
        'flex flex-col min-w-[280px] w-[280px] rounded-xl border transition-colors',
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
      {/* Column header */}
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
        <div className='flex items-center gap-1.5'>
          <span className='text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5'>
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className='flex flex-col gap-2 p-2 overflow-y-auto min-h-[120px]'>
        {cards.map((card) => {
          return (
            <KanbanCardItem
              key={card.id}
              card={card}
              onMoveToColumn={onMoveToColumn}
              columns={KANBAN_COLUMNS}
              isMoving={movingCardId === card.id}
              onCardClick={onCardClick}
            />
          );
        })}
        {cards.length === 0 ? (
          <div className='flex items-center justify-center h-20 text-xs text-muted-foreground/50 select-none'>
            Drop cards here
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * KanbanBoard is the main kanban board client component.
 * Shared filters (org, team, search, type, assignee, priority) come from parent via props.
 * @param props - component props.
 * @param props.initialColumns - initial grouped cards by status.
 * @param props.organizations - organizations list (unused here, kept for future use).
 * @param props.persons - persons list (unused here, kept for future use).
 * @param props.filters - shared filter values from parent.
 * @param props.columnsVersion - increments when server re-fetches with new filters.
 * @returns JSX element.
 */
export function KanbanBoard({
  initialColumns,
  organizations: _organizations,
  persons: _persons,
  filters,
  columnsVersion,
}: KanbanBoardProps) {
  const [columns, setColumns] =
    useState<Record<IssueStatus, KanbanCard[]>>(initialColumns);
  const [movingCardId, setMovingCardId] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<KanbanCard | null>(null);
  const [, startTransition] = useTransition();

  // Sync columns when server re-fetches data with new filters
  useEffect(() => {
    setColumns(initialColumns);
  }, [columnsVersion]);

  /**
   *
   * @param prev
   * @param cardId
   * @param card
   * @param sourceStatus
   * @param targetStatus
   */
  const applyOptimisticMove = (
    prev: Record<IssueStatus, KanbanCard[]>,
    cardId: number,
    card: KanbanCard,
    sourceStatus: IssueStatus,
    targetStatus: IssueStatus,
  ): Record<IssueStatus, KanbanCard[]> => {
    const next = { ...prev };

    next[sourceStatus] = next[sourceStatus].filter((c) => {
      return c.id !== cardId;
    });
    next[targetStatus] = [
      { ...card, status: targetStatus },
      ...next[targetStatus],
    ];

    return next;
  };
  /**
   *
   * @param prev
   * @param cardId
   * @param card
   * @param sourceStatus
   * @param targetStatus
   */
  const revertOptimisticMove = (
    prev: Record<IssueStatus, KanbanCard[]>,
    cardId: number,
    card: KanbanCard,
    sourceStatus: IssueStatus,
    targetStatus: IssueStatus,
  ): Record<IssueStatus, KanbanCard[]> => {
    const next = { ...prev };

    next[targetStatus] = next[targetStatus].filter((c) => {
      return c.id !== cardId;
    });
    next[sourceStatus] = [card, ...next[sourceStatus]];

    return next;
  };
  /**
   *
   * @param cardId
   * @param sourceStatus
   * @param targetStatus
   */
  const handleDrop = (
    cardId: number,
    sourceStatus: IssueStatus,
    targetStatus: IssueStatus,
  ) => {
    const sourceCards = columns[sourceStatus];
    const card = sourceCards.find((c) => {
      return c.id === cardId;
    });

    if (!card) return;

    const frozenCard = card;

    setColumns((prev) => {
      return applyOptimisticMove(
        prev,
        cardId,
        frozenCard,
        sourceStatus,
        targetStatus,
      );
    });
    setMovingCardId(cardId);

    startTransition(async () => {
      try {
        await moveKanbanCard(cardId, targetStatus, frozenCard);
        const colLabel =
          KANBAN_COLUMNS.find((col) => {
            return col.id === targetStatus;
          })?.label ?? targetStatus;

        toast.success(`Moved to ${colLabel}`);
      } catch (error) {
        setColumns((prev) => {
          return revertOptimisticMove(
            prev,
            cardId,
            frozenCard,
            sourceStatus,
            targetStatus,
          );
        });
        toast.error((error as Error).message);
      } finally {
        setMovingCardId(null);
      }
    });
  };
  /**
   *
   * @param card
   * @param status
   */
  const handleMoveToColumn = (card: KanbanCard, status: IssueStatus) => {
    if (card.status === status) return;

    handleDrop(card.id, card.status, status);
  };

  // Client-side filtering: search, priority, assignee, type, status
  // Filter against initialColumns to preserve optimistic updates while applying filters
  const lowerSearch = filters.search.toLowerCase();
  const filteredColumns: Record<IssueStatus, KanbanCard[]> = {
    open: [],
    in_progress: [],
    paused: [],
    done: [],
  };

  for (const col of KANBAN_COLUMNS) {
    const sourceCards = columns[col.id] ?? [];

    // If status filter is set and doesn't match this column, skip entirely
    if (filters.status && col.id !== filters.status) {
      continue;
    }

    // When status filter is active, put all matching cards into the target column
    const targetColId = filters.status || col.id;

    for (const card of sourceCards) {
      // Assignee filter
      if (filters.assignee_id) {
        const assigneeId = Number(filters.assignee_id);

        if (card.assignee_id !== assigneeId) {
          continue;
        }
      }

      // Type filter
      if (filters.type && card.type !== filters.type) {
        continue;
      }

      // Search filter
      if (
        lowerSearch.length > 0 &&
        !card.name.toLowerCase().includes(lowerSearch) &&
        !(card.description?.toLowerCase().includes(lowerSearch) ?? false)
      ) {
        continue;
      }

      // Priority filter
      if (filters.priority && card.priority !== filters.priority) {
        continue;
      }

      filteredColumns[targetColId].push(card);
    }
  }

  return (
    <div className='flex flex-col h-full gap-3'>
      {/* Board: columns */}
      <div className='flex gap-3 flex-1 min-h-0'>
        <div className='flex gap-3 overflow-x-auto pb-4 flex-1 min-h-0'>
          {KANBAN_COLUMNS.map((col) => {
            return (
              <KanbanColumnComponent
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                cards={filteredColumns[col.id]}
                onDrop={handleDrop}
                onMoveToColumn={handleMoveToColumn}
                movingCardId={movingCardId}
                onCardClick={(card) => {
                  setHoveredCard((prev) => {
                    return prev?.id === card.id ? null : card;
                  });
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Task preview modal */}
      <TaskPreviewModal
        card={hoveredCard}
        onClose={() => {
          setHoveredCard(null);
        }}
      />
    </div>
  );
}
