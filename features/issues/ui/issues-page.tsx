'use client';

import { format } from 'date-fns';
import { Bug } from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { toast } from 'sonner';

import { loadIssuesChunk, updateIssue } from '@/features/issues/api/issues';
import { ISSUE_STATUS_OPTIONS } from '@/features/issues/model/types';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import { SortableHeader } from '@/shared/ui/table/SortableHeader';

import type {
  Issue,
  IssuePriority,
  IssueSortField,
  IssueStatus,
  PersonOption,
  SharedFilters,
  SortOrder,
} from '@/features/issues/model/types';

const PAGE_SIZE = 20;

interface IssuesPageProps {
  initialIssues: Issue[];
  initialTotalCount: number;
  persons: PersonOption[];
  filters: SharedFilters;
  filtersVersion: number;
  initialSort: IssueSortField;
  initialOrder: SortOrder;
}

/**
 * formatIssueDate.
 * @param value - iso string.
 * @returns formatted date.
 */
function formatIssueDate(value: string) {
  return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

/**
 * statusVariant.
 * @param status - issue status.
 * @returns badge variant.
 */
function statusVariant(status: string) {
  switch (status) {
    case 'open': {
      return 'warning';
    }
    case 'in_progress': {
      return 'primary';
    }
    case 'paused': {
      return 'default';
    }
    case 'done': {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
}

/**
 * formatIssueStatus.
 * @param status - issue status.
 * @returns label.
 */
function formatIssueStatus(status: IssueStatus) {
  const match = ISSUE_STATUS_OPTIONS.find((option) => {
    return option.value === status;
  });

  return match?.label ?? status;
}

/**
 *
 * @param issue
 */
function formatIssueScope(issue: Issue) {
  if (!issue.organization_id) {
    return '—';
  }

  return issue.team_id
    ? `Org #${issue.organization_id} · Team #${issue.team_id}`
    : `Org #${issue.organization_id}`;
}

/**
 * IssuesPage renders the issues list with infinite scroll.
 * All filters (org, team, search, type, assignee, priority, status) are controlled by parent.
 * Tab-local filters: sort.
 * @param props - component props.
 * @param props.initialIssues
 * @param props.initialTotalCount
 * @param props.persons
 * @param props.filters
 * @param props.filtersVersion
 * @param props.initialSort
 * @param props.initialOrder
 * @returns JSX element.
 */
export function IssuesPage({
  initialIssues,
  initialTotalCount,
  persons,
  filters,
  filtersVersion,
  initialSort,
  initialOrder,
}: IssuesPageProps) {
  const [isPending, startTransition] = useTransition();
  const [sortField, setSortField] = useState<IssueSortField>(initialSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [firstPage, setFirstPage] = useState<{
    items: Issue[];
    hasMore: boolean;
  }>({
    items: initialIssues,
    hasMore: initialTotalCount > initialIssues.length,
  });
  const isFirstRender = useRef(true);
  const [editingStatusIssueId, setEditingStatusIssueId] = useState<
    number | null
  >(null);
  const [editingAssigneeIssueId, setEditingAssigneeIssueId] = useState<
    number | null
  >(null);

  // filtersRef used inside fetchMore without triggering re-renders
  const filtersRef = useRef({
    ...filters,
    sort: sortField,
    order: sortOrder,
  });

  // Keep filtersRef in sync with latest props/state (useEffect avoids updating during render)
  useEffect(() => {
    filtersRef.current = {
      ...filters,
      sort: sortField,
      order: sortOrder,
    };
  });

  // Reload first page whenever filters or sort change (skip initial render — SSR data is already correct)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    const f = filtersRef.current;

    loadIssuesChunk({
      organization_id: f.organization_id ? Number(f.organization_id) : null,
      team_id: f.team_id ? Number(f.team_id) : null,
      status: f.status || undefined,
      type: f.type || undefined,
      assignee: f.assignee_id ? Number(f.assignee_id) : null,
      offset: 0,
      limit: PAGE_SIZE,
      sort: f.sort,
      order: f.order,
      search: f.search || undefined,
    })
      .then(({ items, hasMore: more }) => {
        setFirstPage({ items, hasMore: more });
      })
      .catch(() => {
        // silently fail — existing items remain visible
      });
  }, [filtersVersion, sortField, sortOrder]);

  const scrollInitialItems = useMemo(() => {
    return firstPage.items;
  }, [firstPage]);

  const fetchMore = useCallback(
    async (offset: number) => {
      const f = filtersRef.current;

      return loadIssuesChunk({
        organization_id: f.organization_id ? Number(f.organization_id) : null,
        team_id: f.team_id ? Number(f.team_id) : null,
        status: f.status || undefined,
        type: f.type || undefined,
        assignee: f.assignee_id ? Number(f.assignee_id) : null,
        offset,
        limit: PAGE_SIZE,
        sort: f.sort,
        order: f.order,
        search: f.search || undefined,
      });
    },
    [filtersVersion, sortField, sortOrder],
  );

  const {
    items: rawItems,
    isLoading,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<Issue>({
    fetchMore,
    initialItems: scrollInitialItems,
    initialHasMore: firstPage.hasMore,
  });

  // Client-side priority filter (backend doesn't support priority filtering)
  const items = filters.priority
    ? rawItems.filter((issue) => {
        return issue.priority === (filters.priority as IssuePriority);
      })
    : rawItems;

  const handleSort = useCallback(
    (field: string) => {
      const sortableField = field as IssueSortField;
      const newOrder =
        sortField === sortableField && sortOrder === 'desc' ? 'asc' : 'desc';

      setSortField(sortableField);
      setSortOrder(newOrder);
    },
    [sortField, sortOrder],
  );

  const rowStatusOptions = ISSUE_STATUS_OPTIONS;
  const rowAssigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.email ? `${person.name} (${person.email})` : person.name,
      };
    }),
  ];

  /**
   *
   * @param issue
   * @param patch
   */
  const updateIssueInline = (
    issue: Issue,
    patch: Partial<Pick<Issue, 'status' | 'assignee_id'>>,
  ) => {
    const nextStatus = (patch.status ?? issue.status) as IssueStatus;
    const nextAssigneeId =
      patch.assignee_id === undefined ? issue.assignee_id : patch.assignee_id;

    setUpdatingIssueId(issue.id);

    startTransition(async () => {
      try {
        const result = await updateIssue(issue.id, {
          name: issue.name,
          description: issue.description,
          type: issue.type,
          status: nextStatus,
          organization_id: issue.organization_id,
          team_id: issue.team_id,
          assignee_id: nextAssigneeId,
        });

        if ('error' in result) {
          setUpdatingIssueId(null);
          toast.error(result.error);

          return;
        }

        setUpdatingIssueId(null);
        setEditingStatusIssueId(null);
        setEditingAssigneeIssueId(null);
        toast.success('Issue updated');
      } catch (error) {
        setUpdatingIssueId(null);
        toast.error((error as Error).message);
      }
    });
  };

  return (
    <div className='flex flex-col gap-6'>
      {items.length === 0 && !isLoading ? (
        <div className='rounded-[var(--radius-card)] border border-border bg-card p-6'>
          <EmptyState
            icon={Bug}
            title='No issues found'
            description='Adjust filters or create a new issue.'
          />
        </div>
      ) : (
        <div className='overflow-hidden rounded-[var(--radius-card)] border border-border bg-card'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[920px] text-sm'>
              <thead className='bg-accent/30 text-left text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3'>
                    <SortableHeader
                      field='name'
                      label='Issue'
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className='px-4 py-3'>
                    <SortableHeader
                      field='type'
                      label='Type'
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className='px-4 py-3'>
                    <SortableHeader
                      field='status'
                      label='Status'
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className='px-4 py-3'>Scope</th>
                  <th className='px-4 py-3'>Assignee</th>
                  <th className='px-4 py-3'>
                    <SortableHeader
                      field='updated_at'
                      label='Updated'
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((issue) => {
                  return (
                    <tr
                      key={issue.id}
                      className='border-t border-border hover:bg-accent/20'
                    >
                      <td className='px-4 py-3 align-top'>
                        <Link
                          href={`${ROUTES.DASHBOARD.ISSUES}/${issue.id}`}
                          className='font-medium text-foreground hover:text-primary'
                        >
                          {issue.name}
                        </Link>
                        {issue.description ? (
                          <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                            {issue.description}
                          </p>
                        ) : null}
                      </td>
                      <td className='px-4 py-3 align-top'>{issue.type}</td>
                      <td className='px-4 py-3 align-top'>
                        <div className='group/status flex min-w-[180px] flex-col gap-2'>
                          <Badge
                            variant={statusVariant(issue.status)}
                            className='w-fit'
                          >
                            {formatIssueStatus(issue.status)}
                          </Badge>
                          {editingStatusIssueId === issue.id ? (
                            <div className='flex items-center gap-2'>
                              <InputDropdown
                                label='Change status'
                                options={rowStatusOptions}
                                value={issue.status}
                                onChange={(value) => {
                                  updateIssueInline(issue, {
                                    status: value as IssueStatus,
                                  });
                                }}
                                disabled={
                                  isPending || updatingIssueId === issue.id
                                }
                                searchable={false}
                                className='min-w-[180px]'
                              />
                              <Button
                                type='button'
                                variant={BUTTON_VARIANT.secondary}
                                className='h-10 w-auto px-3'
                                onClick={() => {
                                  setEditingStatusIssueId(null);
                                }}
                                disabled={
                                  isPending || updatingIssueId === issue.id
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              type='button'
                              className='w-fit text-xs text-muted-foreground opacity-0 transition-opacity group-hover/status:opacity-100 hover:text-foreground'
                              onClick={() => {
                                setEditingStatusIssueId(issue.id);
                                setEditingAssigneeIssueId(null);
                              }}
                            >
                              Change
                            </button>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3 align-top text-muted-foreground'>
                        {formatIssueScope(issue)}
                      </td>
                      <td className='px-4 py-3 align-top text-muted-foreground'>
                        <div className='group/assignee min-w-[220px]'>
                          {editingAssigneeIssueId === issue.id ? (
                            <div className='flex items-center gap-2'>
                              <InputDropdown
                                label='Assignee'
                                options={rowAssigneeOptions}
                                value={
                                  issue.assignee_id
                                    ? String(issue.assignee_id)
                                    : ''
                                }
                                onChange={(value) => {
                                  updateIssueInline(issue, {
                                    assignee_id: value ? Number(value) : null,
                                  });
                                }}
                                disabled={
                                  isPending || updatingIssueId === issue.id
                                }
                              />
                              <Button
                                type='button'
                                variant={BUTTON_VARIANT.secondary}
                                className='h-10 w-auto px-3'
                                onClick={() => {
                                  setEditingAssigneeIssueId(null);
                                }}
                                disabled={
                                  isPending || updatingIssueId === issue.id
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className='flex flex-col gap-1'>
                              <span className='text-sm text-foreground'>
                                {issue.assignee?.name ??
                                  issue.assignee_id ??
                                  'Unassigned'}
                              </span>
                              <button
                                type='button'
                                className='w-fit text-xs text-muted-foreground opacity-0 transition-opacity group-hover/assignee:opacity-100 hover:text-foreground'
                                onClick={() => {
                                  setEditingAssigneeIssueId(issue.id);
                                  setEditingStatusIssueId(null);
                                }}
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-3 align-top text-muted-foreground'>
                        {formatIssueDate(issue.updated_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isLoading ? (
            <div className='flex justify-center py-4'>
              <SpinLoader />
            </div>
          ) : null}

          {!hasMore && items.length > 0 ? (
            <div className='py-4'>
              <InfiniteScrollStatus itemCount={items.length} />
            </div>
          ) : (
            <div ref={sentinelRef} className='h-10' />
          )}
        </div>
      )}
    </div>
  );
}
