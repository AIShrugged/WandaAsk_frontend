'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  Paperclip,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { toast } from 'sonner';

import {
  fetchArchivedKanbanCards,
  moveKanbanCard,
} from '@/features/kanban/api/kanban';
import {
  KANBAN_COLUMNS,
  type IssueStatus,
  type KanbanCard,
} from '@/features/kanban/model/types';
import { ArchivedDoneSection } from '@/features/kanban/ui/archived-done-section';
import { ArchivedDoneToggle } from '@/features/kanban/ui/archived-done-toggle';
import { ROUTES } from '@/shared/lib/routes';
import Avatar from '@/shared/ui/common/avatar';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { OrganizationProps } from '@/entities/organization';
import type {
  PersonOption,
  SharedFilters,
} from '@/features/issues/model/types';

interface KanbanBoardProps {
  columns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  filters: SharedFilters;
  isFetching?: boolean;
  onShowArchivedChange: (value: boolean) => void;
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
const TaskPreviewModal = memo(function TaskPreviewModal({
  card,
  onClose,
}: {
  card: KanbanCard | null;
  onClose: () => void;
}) {
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
                  <p className='text-xs text-muted-foreground italic'>
                    No description
                  </p>
                )}

                {/* Meta grid */}
                <div className='flex flex-col gap-2 pt-1'>
                  {/* Story points */}
                  {card.story_points !== null &&
                  card.story_points !== undefined ? (
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-muted-foreground'>
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
                      <span className='text-muted-foreground'>Assignee</span>
                      <span className='font-medium text-foreground truncate max-w-[200px]'>
                        {card.assignee.name}
                      </span>
                    </div>
                  ) : null}

                  {/* Created date */}
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>Created</span>
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
});

/**
 * KanbanCardItem renders a single card in a column.
 * @param props - card props.
 * @param props.card - kanban card.
 * @param props.onMoveToColumn - move card handler.
 * @param props.columns - available target columns.
 * @param props.isMoving - whether card is being moved.
 * @param props.onCardClick - called with card when clicked to show preview.
 */
const KanbanCardItem = memo(function KanbanCardItem({
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
        <span className='ml-auto text-muted-foreground'>
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
});

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
const KanbanColumnComponent = memo(function KanbanColumnComponent({
  id,
  label,
  color,
  cards,
  onDrop,
  onMoveToColumn,
  movingCardId,
  onCardClick,
  footer,
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
  footer?: React.ReactNode;
}) {
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

      {/* Cards — no overflow constraint; column grows with content */}
      <div className='flex flex-col gap-2 p-2 min-h-[120px]'>
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
          <div className='flex items-center justify-center h-20 text-xs text-muted-foreground select-none'>
            Drop cards here
          </div>
        ) : null}
      </div>

      {footer}
    </div>
  );
});

/**
 * KanbanBoard is the main kanban board client component.
 * Shared filters (org, team, search, type, assignee, priority) come from parent via props.
 * @param props - component props.
 * @param props.columns - grouped cards by status from the parent fetcher.
 * @param props.organizations - organizations list (unused here, kept for future use).
 * @param props.persons - persons list (unused here, kept for future use).
 * @param props.filters - shared filter values from parent.
 * @param props.isFetching - shows loading overlay when parent is refetching.
 * @returns JSX element.
 */
export function KanbanBoard({
  columns,
  organizations: _organizations,
  persons: _persons,
  filters,
  isFetching = false,
  onShowArchivedChange,
}: KanbanBoardProps) {
  // Optimistic override for drag-and-drop. Reset whenever server columns change.
  const [optimisticColumns, setOptimisticColumns] = useState<Record<
    IssueStatus,
    KanbanCard[]
  > | null>(null);
  const [movingCardId, setMovingCardId] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<KanbanCard | null>(null);
  const [, startTransition] = useTransition();

  // Archived done cards state
  const [archivedDoneCards, setArchivedDoneCards] = useState<KanbanCard[]>([]);
  const [archivedDoneCount, setArchivedDoneCount] = useState<number | null>(
    null,
  );
  const [archivedDoneLoading, setArchivedDoneLoading] = useState(false);
  const showArchived = filters.show_archived;

  // When server data changes (new fetch result), clear any optimistic override.
  useEffect(() => {
    setOptimisticColumns(null);
  }, [columns]);

  // Fetch archived done cards count on filter change (for the toggle badge)
  useEffect(() => {
    setArchivedDoneCount(null);

    const kanbanFilters = {
      organization_id: filters.organization_id
        ? Number(filters.organization_id)
        : null,
      team_id: filters.team_id ? Number(filters.team_id) : null,
      type: filters.type || undefined,
      assignee_id: filters.assignee_id ? Number(filters.assignee_id) : null,
      search: filters.search || undefined,
    };

    let cancelled = false;

    fetchArchivedKanbanCards(kanbanFilters)
      .then((result) => {
        if (cancelled) return;

        if (!result.error && result.data) {
          setArchivedDoneCount(result.data.length);
          if (showArchived) {
            setArchivedDoneCards(result.data);
          }
        } else {
          setArchivedDoneCount(0);
        }
      })
      .catch(() => {
        if (!cancelled) setArchivedDoneCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [columns]);

  // Load archived cards when show_archived toggled on
  useEffect(() => {
    if (!showArchived) {
      setArchivedDoneCards([]);
      return;
    }

    setArchivedDoneLoading(true);

    const kanbanFilters = {
      organization_id: filters.organization_id
        ? Number(filters.organization_id)
        : null,
      team_id: filters.team_id ? Number(filters.team_id) : null,
      type: filters.type || undefined,
      assignee_id: filters.assignee_id ? Number(filters.assignee_id) : null,
      search: filters.search || undefined,
    };

    fetchArchivedKanbanCards(kanbanFilters)
      .then((result) => {
        if (!result.error && result.data) {
          setArchivedDoneCards(result.data);
          setArchivedDoneCount(result.data.length);
        }
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => {
        setArchivedDoneLoading(false);
      });
  }, [showArchived]);

  // The active column data: optimistic (mid-drag) or latest server data.
  const activeColumns = optimisticColumns ?? columns;

  const applyOptimisticMove = useCallback(
    (
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
    },
    [],
  );

  const revertOptimisticMove = useCallback(
    (
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
    },
    [],
  );

  const handleDrop = useCallback(
    (cardId: number, sourceStatus: IssueStatus, targetStatus: IssueStatus) => {
      // Check if dragging from archived section
      const archivedCard = archivedDoneCards.find((c) => {
        return c.id === cardId;
      });
      const sourceCards = activeColumns[sourceStatus];
      const regularCard = sourceCards.find((c) => {
        return c.id === cardId;
      });
      const card = archivedCard ?? regularCard;

      if (!card) return;

      const frozenCard = card;
      const isFromArchived = Boolean(archivedCard);

      // Optimistic update: remove from archived section if applicable
      if (isFromArchived) {
        setArchivedDoneCards((prev) => {
          return prev.filter((c) => {
            return c.id !== cardId;
          });
        });
        setArchivedDoneCount((prev) => {
          return prev === null ? null : Math.max(0, prev - 1);
        });
      }

      if (!isFromArchived) {
        setOptimisticColumns((prev) => {
          return applyOptimisticMove(
            prev ?? activeColumns,
            cardId,
            frozenCard,
            sourceStatus,
            targetStatus,
          );
        });
      }

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
          // Revert archived optimistic update on failure
          if (isFromArchived) {
            setArchivedDoneCards((prev) => {
              return [frozenCard, ...prev];
            });
            setArchivedDoneCount((prev) => {
              return prev === null ? null : prev + 1;
            });
          } else {
            setOptimisticColumns((prev) => {
              return revertOptimisticMove(
                prev ?? activeColumns,
                cardId,
                frozenCard,
                sourceStatus,
                targetStatus,
              );
            });
          }

          toast.error((error as Error).message);
        } finally {
          setMovingCardId(null);
        }
      });
    },
    [
      activeColumns,
      archivedDoneCards,
      applyOptimisticMove,
      revertOptimisticMove,
    ],
  );

  const handleMoveToColumn = useCallback(
    (card: KanbanCard, status: IssueStatus) => {
      if (card.status === status) return;

      handleDrop(card.id, card.status, status);
    },
    [handleDrop],
  );

  const handleCardClick = useCallback((card: KanbanCard) => {
    setHoveredCard((prev) => {
      return prev?.id === card.id ? null : card;
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setHoveredCard(null);
  }, []);

  // Client-side filtering: search, priority, assignee, type, status
  const filteredColumns = useMemo(() => {
    const lowerSearch = filters.search.toLowerCase();
    const result: Record<IssueStatus, KanbanCard[]> = {
      open: [],
      in_progress: [],
      paused: [],
      review: [],
      reopen: [],
      done: [],
    };

    for (const col of KANBAN_COLUMNS) {
      const sourceCards = activeColumns[col.id] ?? [];

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

        result[targetColId].push(card);
      }
    }

    return result;
  }, [activeColumns, filters]);

  return (
    <div className='flex flex-col gap-3 relative'>
      {/* Loading overlay */}
      {isFetching && (
        <div className='absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg'>
          <SpinLoader />
        </div>
      )}

      {/* Board: columns */}
      <div className='flex gap-3'>
        <div className='flex gap-3 overflow-x-auto pb-4 flex-1'>
          {KANBAN_COLUMNS.map((col) => {
            const isDoneColumn = col.id === 'done';

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
                onCardClick={handleCardClick}
                footer={
                  isDoneColumn ? (
                    <>
                      <ArchivedDoneToggle
                        count={archivedDoneCount}
                        expanded={showArchived}
                        loading={archivedDoneLoading}
                        onToggle={() => {
                          onShowArchivedChange(!showArchived);
                        }}
                      />
                      {showArchived && (
                        <ArchivedDoneSection
                          cards={archivedDoneCards}
                          loading={archivedDoneLoading}
                          onCardClick={handleCardClick}
                        />
                      )}
                    </>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Task preview modal */}
      <TaskPreviewModal card={hoveredCard} onClose={handleCloseModal} />
    </div>
  );
}
