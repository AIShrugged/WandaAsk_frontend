'use client';

import {
  AlertTriangle,
  ArrowUp,
  Calendar,
  ExternalLink,
  Minus,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { moveKanbanCard } from '@/features/kanban/api/kanban';
import {
  KANBAN_COLUMNS,
  KANBAN_PRIORITY_LABELS,
  type IssueStatus,
  type KanbanCard,
  type KanbanFilters,
  type KanbanPriority,
} from '@/features/kanban/model/types';
import { getTeams } from '@/features/teams/api/team';
import { ROUTES } from '@/shared/lib/routes';
import Avatar from '@/shared/ui/common/avatar';
import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { OrganizationProps } from '@/entities/organization';
import type { TeamProps } from '@/entities/team';
import type { PersonOption } from '@/features/issues/model/types';

interface KanbanBoardProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  initialFilters: KanbanFilters & { search: string };
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
 * TaskPreviewPanel shows a detailed preview of a clicked kanban card.
 * @param props - component props.
 * @param props.card - card to preview, or null when none is selected.
 * @param props.onClose - called to close the panel.
 */
function TaskPreviewPanel({
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
    task: 'bg-blue-500/20 text-blue-300',
    bug: 'bg-red-500/20 text-red-300',
  };
  const colConfig = card
    ? (KANBAN_COLUMNS.find((col) => {
        return col.id === card.status;
      }) ?? KANBAN_COLUMNS[0])
    : null;

  return (
    <div
      className={[
        'w-full flex-shrink-0 rounded-xl border transition-all duration-200',
        'flex flex-col overflow-hidden h-full',
        card
          ? 'border-border bg-card/80 opacity-100'
          : 'border-transparent bg-transparent opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {card ? (
        <>
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
              I{card.id}
            </span>
            <button
              type='button'
              onClick={onClose}
              className='ml-auto p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors'
              aria-label='Close preview'
            >
              ✕
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
              {card.story_points !== null && card.story_points !== undefined ? (
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground/60'>Story points</span>
                  <span className='font-medium text-foreground'>
                    {card.story_points}
                  </span>
                </div>
              ) : null}

              {/* Assignee */}
              {card.assignee ? (
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground/60'>Assignee</span>
                  <span className='font-medium text-foreground truncate max-w-[140px]'>
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
        </>
      ) : null}
    </div>
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
    task: 'bg-blue-500/20 text-blue-300',
    bug: 'bg-red-500/20 text-red-300',
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

      {/* Footer row */}
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <div className='flex items-center gap-3'>
          {/* Issue id + priority */}
          <span className='text-muted-foreground/60 font-mono'>I{card.id}</span>
          <PriorityIcon priority={card.priority ?? 'low'} />
          {card.story_points !== null && card.story_points !== undefined ? (
            <span>{card.story_points}</span>
          ) : null}
        </div>

        <div className='flex items-center gap-3'>
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

          {/* Assignee avatar */}
          {card.assignee ? (
            <Avatar size='xs' className='text-[10px]'>
              {getInitials(card.assignee.name)}
            </Avatar>
          ) : null}
        </div>
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
 * @param props.onCardHover
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
          <Link
            href={`${ROUTES.DASHBOARD.ISSUES}/create?status=${id}`}
            className='p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors'
          >
            <Plus className='h-3.5 w-3.5' />
          </Link>
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
 * @param props - component props.
 * @param props.initialColumns - initial grouped cards by status.
 * @param props.organizations - organizations list for filter.
 * @param props.persons - persons list for assignee filter.
 * @param props.initialFilters - initial filter values.
 * @returns JSX element.
 */
export function KanbanBoard({
  initialColumns,
  organizations,
  persons,
  initialFilters,
}: KanbanBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [columns, setColumns] =
    useState<Record<IssueStatus, KanbanCard[]>>(initialColumns);
  // Sync columns when server re-fetches data with new filters.
  // initialColumns is a new object reference on every server render,
  // so we use a serialized key from the URL search params as a stable dependency.
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    setColumns(initialColumns);
  }, [searchParamsString]);

  const [movingCardId, setMovingCardId] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<KanbanCard | null>(null);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.search ?? '');
  const [orgId, setOrgId] = useState(
    initialFilters.organization_id
      ? String(initialFilters.organization_id)
      : '',
  );
  const [teamId, setTeamId] = useState(
    initialFilters.team_id ? String(initialFilters.team_id) : '',
  );
  const [teams, setTeams] = useState<TeamProps[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setTeams([]);
      setTeamId('');

      return;
    }

    setIsTeamsLoading(true);

    getTeams(orgId)
      .then(({ data }) => {
        setTeams(data ?? []);
      })
      .catch(() => {
        setTeams([]);
      })
      .finally(() => {
        setIsTeamsLoading(false);
      });
  }, [orgId]);

  const [type, setType] = useState(initialFilters.type ?? '');
  const [assigneeId, setAssigneeId] = useState(
    initialFilters.assignee_id ? String(initialFilters.assignee_id) : '',
  );
  const [priority, setPriority] = useState<KanbanPriority | ''>(
    (initialFilters.priority as KanbanPriority | '') ?? '',
  );
  const updateUrl = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      router.replace(`/dashboard/kanban?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );
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
  // Client-side search filter
  const filteredColumns: Record<IssueStatus, KanbanCard[]> = {
    open: [],
    in_progress: [],
    paused: [],
    done: [],
  };
  const lowerSearch = search.toLowerCase();

  for (const col of KANBAN_COLUMNS) {
    filteredColumns[col.id] = columns[col.id].filter((card) => {
      if (!lowerSearch) return true;

      return (
        card.name.toLowerCase().includes(lowerSearch) ||
        (card.description?.toLowerCase().includes(lowerSearch) ?? false)
      );
    });
  }

  const orgOptions = [
    { value: '', label: 'All orgs' },
    ...organizations.map((org) => {
      return { value: String(org.id), label: org.name };
    }),
  ];
  const teamOptions = [
    { value: '', label: isTeamsLoading ? 'Loading...' : 'All teams' },
    ...teams.map((team) => {
      return { value: String(team.id), label: team.name };
    }),
  ];
  const typeOptions = [
    { value: '', label: 'All' },
    { value: 'task', label: 'Task' },
    { value: 'bug', label: 'Bug' },
  ];
  const assigneeOptions = [
    { value: '', label: 'All' },
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.name,
      };
    }),
  ];
  const priorityOptions = [
    { value: '', label: 'All' },
    ...Object.entries(KANBAN_PRIORITY_LABELS).map(([value, label]) => {
      return { value, label };
    }),
  ];

  return (
    <div className='flex flex-col h-full gap-3'>
      {/* Filters bar */}
      <div className='flex flex-wrap items-center gap-2 px-1'>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span>Org:</span>
          <InputDropdown
            options={orgOptions}
            value={orgId}
            onChange={(value) => {
              setOrgId(value as string);
              setTeamId('');
              updateUrl({ organization_id: value as string, team_id: '' });
            }}
            className='w-[140px]'
            searchable
          />
        </div>

        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span>Team:</span>
          <InputDropdown
            options={teamOptions}
            value={teamId}
            onChange={(value) => {
              setTeamId(value as string);
              updateUrl({ team_id: value as string });
            }}
            className='w-[130px]'
            disabled={!orgId || isTeamsLoading}
          />
        </div>

        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span>Type:</span>
          <InputDropdown
            options={typeOptions}
            value={type}
            onChange={(value) => {
              setType(value as string);
              updateUrl({ type: value as string });
            }}
            className='w-[120px]'
          />
        </div>

        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span>Assignee:</span>
          <InputDropdown
            options={assigneeOptions}
            value={assigneeId}
            onChange={(value) => {
              setAssigneeId(value as string);
              updateUrl({ assignee_id: value as string });
            }}
            className='w-[130px]'
            searchable
          />
        </div>

        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span>Priority:</span>
          <InputDropdown
            options={priorityOptions}
            value={priority}
            onChange={(value) => {
              setPriority(value as KanbanPriority | '');
              updateUrl({ priority: value as string });
            }}
            className='w-[110px]'
          />
        </div>

        <div className='ml-auto flex-1 min-w-0 max-w-xs'>
          <div className='relative'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none' />
            <input
              type='text'
              placeholder='Search issues...'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              className='w-full h-8 pl-8 pr-3 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
            />
          </div>
        </div>

        <Link
          href={`${ROUTES.DASHBOARD.ISSUES}/create`}
          className='flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg bg-gradient-to-b from-violet-500 to-violet-700 text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600 flex-shrink-0'
        >
          <Plus className='h-3.5 w-3.5' />
          Create
        </Link>
      </div>

      {/* Board: columns + preview panel */}
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

        {/* Preview panel — hidden on small screens, revealed on card click */}
        <div
          className={[
            'hidden lg:flex pb-4 flex-shrink-0 self-stretch items-stretch overflow-hidden transition-all duration-200',
            hoveredCard ? 'w-[260px] xl:w-[300px]' : 'w-0',
          ].join(' ')}
        >
          <TaskPreviewPanel
            card={hoveredCard}
            onClose={() => {
              setHoveredCard(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
