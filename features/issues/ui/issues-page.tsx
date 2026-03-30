'use client';

import { format } from 'date-fns';
import { Bug, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import {
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_OPTIONS,
} from '@/features/issues/model/types';
import { getTeams } from '@/features/teams/api/team';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import { SortableHeader } from '@/shared/ui/table/SortableHeader';

import type { OrganizationProps } from '@/entities/organization';
import type {
  Issue,
  IssuePriority,
  IssueSortField,
  IssueStatus,
  IssueType,
  PersonOption,
  SortOrder,
} from '@/features/issues/model/types';

const PAGE_SIZE = 20;

interface IssuesPageProps {
  initialIssues: Issue[];
  initialTotalCount: number;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  currentUserId?: number | null;
  initialFilters: {
    organization_id: string;
    team_id: string;
    status: IssueStatus | '';
    type: IssueType | '';
    assignee: string;
    priority: IssuePriority | '';
    sort: IssueSortField;
    order: SortOrder;
    search: string;
  };
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
 *
 * @param issues
 * @param updatedIssue
 */
function replaceIssueInList(issues: Issue[], updatedIssue: Issue) {
  return issues.map((item) => {
    return item.id === updatedIssue.id ? updatedIssue : item;
  });
}

/**
 * IssuesPage renders list with filters and infinite scroll.
 * @param props - component props.
 * @param props.initialIssues
 * @param props.initialTotalCount
 * @param props.organizations
 * @param props.persons
 * @param props.initialFilters
 * @returns JSX element.
 */
export function IssuesPage({
  initialIssues,
  initialTotalCount,
  organizations,
  persons,
  currentUserId,
  initialFilters,
}: IssuesPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [organizationId, setOrganizationId] = useState(
    initialFilters.organization_id,
  );
  const [teamId, setTeamId] = useState(initialFilters.team_id);
  const [status, setStatus] = useState(initialFilters.status);
  const [type, setType] = useState(initialFilters.type);
  const [assignee, setAssignee] = useState(initialFilters.assignee);
  const [priority, setPriority] = useState<IssuePriority | ''>(
    initialFilters.priority,
  );
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [editingStatusIssueId, setEditingStatusIssueId] = useState<
    number | null
  >(null);
  const [editingAssigneeIssueId, setEditingAssigneeIssueId] = useState<
    number | null
  >(null);
  const [sortField, setSortField] = useState<IssueSortField>(
    initialFilters.sort,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialFilters.order);
  const [searchValue, setSearchValue] = useState(initialFilters.search);
  // Filters ref — used inside fetchMore without triggering re-renders
  const filtersRef = useRef({
    organization_id: organizationId,
    team_id: teamId,
    status,
    type,
    assignee,
    sort: initialFilters.sort,
    order: initialFilters.order,
    search: initialFilters.search,
  });
  // resetKey increments on filter change to reset the infinite scroll list
  const [resetKey, setResetKey] = useState(0);

  // resetKey changes force useInfiniteScroll to start fresh with new initialItems

  const scrollInitialItems = useMemo(() => {
    return initialIssues;
  }, [resetKey]);
  const fetchMore = useCallback(
    async (offset: number) => {
      const f = filtersRef.current;

      return loadIssuesChunk({
        organization_id: f.organization_id ? Number(f.organization_id) : null,
        team_id: f.team_id ? Number(f.team_id) : null,
        status: f.status || undefined,
        type: f.type || undefined,
        assignee: f.assignee ? Number(f.assignee) : null,
        offset,
        limit: PAGE_SIZE,
        sort: f.sort,
        order: f.order,
        search: f.search || undefined,
      });
    },
    // resetKey forces useInfiniteScroll to re-instantiate with fresh initialItems

    [resetKey],
  );
  const {
    items: rawItems,
    isLoading,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<Issue>({
    fetchMore,
    initialItems: scrollInitialItems,
    initialHasMore: initialTotalCount > initialIssues.length,
  });
  // Client-side priority filter (backend doesn't support priority filtering)
  const items = priority
    ? rawItems.filter((issue) => {
        return issue.priority === priority;
      })
    : rawItems;
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

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );
  const applyFilter = useCallback(
    (patch: {
      organization_id?: string;
      team_id?: string;
      status?: IssueStatus | '';
      type?: IssueType | '';
      assignee?: string;
      sort?: IssueSortField;
      order?: SortOrder;
      search?: string;
    }) => {
      const next = {
        organization_id:
          patch.organization_id === undefined
            ? organizationId
            : patch.organization_id,
        team_id: patch.team_id === undefined ? teamId : patch.team_id,
        status: patch.status === undefined ? status : patch.status,
        type: patch.type === undefined ? type : patch.type,
        assignee: patch.assignee === undefined ? assignee : patch.assignee,
        sort: patch.sort === undefined ? sortField : patch.sort,
        order: patch.order === undefined ? sortOrder : patch.order,
        search: patch.search === undefined ? searchValue : patch.search,
      };

      filtersRef.current = next;

      if (patch.organization_id !== undefined)
        setOrganizationId(next.organization_id);

      if (patch.team_id !== undefined) setTeamId(next.team_id);

      if (patch.status !== undefined) setStatus(next.status);

      if (patch.type !== undefined) setType(next.type);

      if (patch.assignee !== undefined) setAssignee(next.assignee);

      if (patch.sort !== undefined) setSortField(next.sort);

      if (patch.order !== undefined) setSortOrder(next.order);

      updateUrl({
        organization_id: next.organization_id,
        team_id: next.team_id,
        status: next.status,
        type: next.type,
        assignee: next.assignee,
        sort: next.sort,
        order: next.order,
        search: next.search,
      });

      setResetKey((k) => {
        return k + 1;
      });
    },
    [
      organizationId,
      teamId,
      status,
      type,
      assignee,
      sortField,
      sortOrder,
      searchValue,
      updateUrl,
    ],
  );
  const handleSort = useCallback(
    (field: string) => {
      const sortableField = field as IssueSortField;
      const newOrder =
        sortField === sortableField && sortOrder === 'desc' ? 'asc' : 'desc';

      applyFilter({ sort: sortableField, order: newOrder });
    },
    [sortField, sortOrder, applyFilter],
  );
  // Debounce search: apply filter 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilter({ search: searchValue });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchValue]);
  const personOptions = [
    { value: '', label: 'Any assignee' },
    ...(currentUserId ? [{ value: String(currentUserId), label: 'Me' }] : []),
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.email ? `${person.name} (${person.email})` : person.name,
      };
    }),
  ];
  const statusOptions = [
    { value: '', label: 'Any status' },
    ...ISSUE_STATUS_OPTIONS,
  ];
  const typeOptions = [
    { value: '', label: 'Any type' },
    { value: 'development', label: 'Development' },
    { value: 'organization', label: 'Organization' },
  ];
  const priorityOptions = [
    { value: '', label: 'Any priority' },
    ...Object.entries(ISSUE_PRIORITY_LABELS).map(([value, label]) => {
      return { value, label };
    }),
  ];
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
      <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
        <Link
          href={`${ROUTES.DASHBOARD.ISSUES}/create`}
          className='inline-flex h-10 w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-4 text-sm font-medium text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
        >
          <Plus className='h-4 w-4' />
          New issue
        </Link>
      </div>

      <div className='grid gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search by name...'
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            className='h-10 w-full rounded-[var(--radius-button)] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
        <TenantScopeFields
          organizations={organizations}
          organizationId={organizationId}
          teamId={teamId}
          fetchTeams={getTeams}
          onOrganizationChange={(value) => {
            applyFilter({ organization_id: value, team_id: '' });
          }}
          onTeamChange={(value) => {
            applyFilter({ team_id: value });
          }}
          disabled={isPending}
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <InputDropdown
            label='Type'
            options={typeOptions}
            value={type}
            onChange={(value) => {
              applyFilter({ type: value as IssueType | '' });
            }}
          />
          <InputDropdown
            label='Status'
            options={statusOptions}
            value={status}
            onChange={(value) => {
              applyFilter({ status: value as IssueStatus | '' });
            }}
          />
          <InputDropdown
            label='Assignee'
            options={personOptions}
            value={assignee}
            onChange={(value) => {
              applyFilter({ assignee: value as string });
            }}
            searchable
          />
          <InputDropdown
            label='Priority'
            options={priorityOptions}
            value={priority}
            onChange={(value) => {
              setPriority(value as IssuePriority | '');
              updateUrl({ priority: value as string });
            }}
          />
        </div>
      </div>

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
