'use client';

import { format } from 'date-fns';
import {
  AlertCircle,
  Bug,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { getIssues, updateIssue } from '@/features/issues/api/issues';
import { ISSUE_STATUS_OPTIONS } from '@/features/issues/model/types';
import { ROUTES } from '@/shared/lib/routes';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import Input from '@/shared/ui/input/Input';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';

import type { OrganizationProps } from '@/entities/organization';
import type {
  Issue,
  IssueStatus,
  PersonOption,
} from '@/features/issues/model/types';

type SortKey =
  | 'updated_desc'
  | 'updated_asc'
  | 'created_desc'
  | 'created_asc'
  | 'name_asc'
  | 'name_desc'
  | 'status_asc'
  | 'status_desc';

interface IssuesPageProps {
  initialIssues: Issue[];
  initialTotalCount: number;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  initialFilters: {
    organization_id: string;
    team_id: string;
    status: IssueStatus | '';
    type: string;
    assignee: string;
    page: number;
    pageSize: number;
    sort: SortKey;
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
 * sortIssues sorts current page items client-side.
 * @param issues - issues.
 * @param sort - sort key.
 * @returns sorted issues.
 */
function sortIssues(issues: Issue[], sort: SortKey) {
  const copy = [...issues];

  copy.sort((left, right) => {
    switch (sort) {
      case 'updated_asc': {
        return left.updated_at.localeCompare(right.updated_at);
      }
      case 'updated_desc': {
        return right.updated_at.localeCompare(left.updated_at);
      }
      case 'created_asc': {
        return left.created_at.localeCompare(right.created_at);
      }
      case 'created_desc': {
        return right.created_at.localeCompare(left.created_at);
      }
      case 'name_asc': {
        return left.name.localeCompare(right.name);
      }
      case 'name_desc': {
        return right.name.localeCompare(left.name);
      }
      case 'status_asc': {
        return left.status.localeCompare(right.status);
      }
      case 'status_desc': {
        return right.status.localeCompare(left.status);
      }
      default: {
        return 0;
      }
    }
  });

  return copy;
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
 * IssuesPage renders list, filters, sort and pagination.
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
  initialFilters,
}: IssuesPageProps) {
  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const [issues, setIssues] = useState(initialIssues);

  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const [isPending, startTransition] = useTransition();

  const [loadError, setLoadError] = useState('');

  const [organizationId, setOrganizationId] = useState(
    initialFilters.organization_id,
  );

  const [teamId, setTeamId] = useState(initialFilters.team_id);

  const [status, setStatus] = useState(initialFilters.status);

  const [type, setType] = useState(initialFilters.type);

  const [assignee, setAssignee] = useState(initialFilters.assignee);

  const [page, setPage] = useState(initialFilters.page);

  const [pageSize, setPageSize] = useState(initialFilters.pageSize);

  const [sort, setSort] = useState<SortKey>(initialFilters.sort);

  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);

  const [editingStatusIssueId, setEditingStatusIssueId] = useState<
    number | null
  >(null);

  const [editingAssigneeIssueId, setEditingAssigneeIssueId] = useState<
    number | null
  >(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIssues(initialIssues);

    setTotalCount(initialTotalCount);
  }, [initialIssues, initialTotalCount]);

  /**
   *
   * @param nextState
   * @param nextState.organization_id
   * @param nextState.team_id
   * @param nextState.status
   * @param nextState.type
   * @param nextState.assignee
   * @param nextState.page
   * @param nextState.pageSize
   * @param nextState.sort
   */
  const updateUrl = (nextState: {
    organization_id: string;
    team_id: string;
    status: IssueStatus | '';
    type: string;
    assignee: string;
    page: number;
    pageSize: number;
    sort: SortKey;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    const pairs: Record<string, string> = {
      organization_id: nextState.organization_id,
      team_id: nextState.team_id,
      status: nextState.status,
      type: nextState.type,
      assignee: nextState.assignee,
      page: String(nextState.page),
      pageSize: String(nextState.pageSize),
      sort: nextState.sort,
    };

    for (const [key, value] of Object.entries(pairs)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  /**
   *
   * @param nextState
   * @param nextState.organization_id
   * @param nextState.team_id
   * @param nextState.status
   * @param nextState.type
   * @param nextState.assignee
   * @param nextState.page
   * @param nextState.pageSize
   * @param nextState.sort
   */
  const fetchPage = (nextState: {
    organization_id: string;
    team_id: string;
    status: IssueStatus | '';
    type: string;
    assignee: string;
    page: number;
    pageSize: number;
    sort: SortKey;
  }) => {
    setLoadError('');
    updateUrl(nextState);

    startTransition(async () => {
      try {
        const offset = (nextState.page - 1) * nextState.pageSize;

        const result = await getIssues({
          organization_id: nextState.organization_id
            ? Number(nextState.organization_id)
            : null,
          team_id: nextState.team_id ? Number(nextState.team_id) : null,
          status: nextState.status || undefined,
          type: nextState.type || undefined,
          assignee: nextState.assignee ? Number(nextState.assignee) : null,
          offset,
          limit: nextState.pageSize,
        });

        setIssues(result.data);
        setTotalCount(result.totalCount);
        setEditingStatusIssueId(null);
        setEditingAssigneeIssueId(null);
      } catch (error) {
        setLoadError((error as Error).message);
      }
    });
  };

  const personOptions = [
    { value: '', label: 'Any assignee' },
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

  const sortOptions = [
    { value: 'updated_desc', label: 'Updated: newest first' },
    { value: 'updated_asc', label: 'Updated: oldest first' },
    { value: 'created_desc', label: 'Created: newest first' },
    { value: 'created_asc', label: 'Created: oldest first' },
    { value: 'name_asc', label: 'Name: A to Z' },
    { value: 'name_desc', label: 'Name: Z to A' },
    { value: 'status_asc', label: 'Status: A to Z' },
    { value: 'status_desc', label: 'Status: Z to A' },
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

        setIssues((current) => {
          return replaceIssueInList(current, result);
        });
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

  const sortedIssues = useMemo(() => {
    return sortIssues(issues, sort);
  }, [issues, sort]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;

  const pageEnd = Math.min(totalCount, page * pageSize);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
        <div>
          <h2 className='text-2xl font-semibold text-foreground'>Issues</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Tenant-aware tasks with filters, sorting and attachments.
          </p>
        </div>

        <Link
          href={`${ROUTES.DASHBOARD.ISSUES}/create`}
          className='inline-flex h-10 w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-gradient-to-b from-violet-500 to-violet-700 px-4 text-sm font-medium text-primary-foreground shadow-[0_2px_12px_rgba(124,58,237,0.25)] transition-all hover:from-violet-400 hover:to-violet-600'
        >
          <Plus className='h-4 w-4' />
          New issue
        </Link>
      </div>

      <div className='grid gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <TenantScopeFields
          organizations={organizations}
          organizationId={organizationId}
          teamId={teamId}
          onOrganizationChange={(value) => {
            const next = {
              organization_id: value,
              team_id: '',
              status,
              type,
              assignee,
              page: 1,
              pageSize,
              sort,
            };

            setOrganizationId(value);
            setTeamId('');
            setPage(1);
            fetchPage(next);
          }}
          onTeamChange={(value) => {
            const next = {
              organization_id: organizationId,
              team_id: value,
              status,
              type,
              assignee,
              page: 1,
              pageSize,
              sort,
            };

            setTeamId(value);
            setPage(1);
            fetchPage(next);
          }}
          disabled={isPending}
        />

        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <InputDropdown
            label='Status'
            options={statusOptions}
            value={status}
            onChange={(value) => {
              const next = {
                organization_id: organizationId,
                team_id: teamId,
                status: value as IssueStatus | '',
                type,
                assignee,
                page: 1,
                pageSize,
                sort,
              };

              setStatus(value as IssueStatus | '');
              setPage(1);
              fetchPage(next);
            }}
          />
          <Input
            label='Type'
            value={type}
            onChange={(event) => {
              setType(event.target.value);
            }}
            onBlur={() => {
              fetchPage({
                organization_id: organizationId,
                team_id: teamId,
                status,
                type,
                assignee,
                page: 1,
                pageSize,
                sort,
              });
              setPage(1);
            }}
          />
          <InputDropdown
            label='Assignee'
            options={personOptions}
            value={assignee}
            onChange={(value) => {
              const next = {
                organization_id: organizationId,
                team_id: teamId,
                status,
                type,
                assignee: value as string,
                page: 1,
                pageSize,
                sort,
              };

              setAssignee(value as string);
              setPage(1);
              fetchPage(next);
            }}
            searchable
          />
          <InputDropdown
            label='Sort'
            options={sortOptions}
            value={sort}
            onChange={(value) => {
              const nextSort = value as SortKey;

              setSort(nextSort);
              updateUrl({
                organization_id: organizationId,
                team_id: teamId,
                status,
                type,
                assignee,
                page,
                pageSize,
                sort: nextSort,
              });
            }}
          />
        </div>
      </div>

      {loadError ? (
        <div className='rounded-[var(--radius-card)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive'>
          {loadError}
        </div>
      ) : null}

      {sortedIssues.length === 0 && !isPending ? (
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
                  <th className='px-4 py-3'>Issue</th>
                  <th className='px-4 py-3'>Type</th>
                  <th className='px-4 py-3'>Status</th>
                  <th className='px-4 py-3'>Scope</th>
                  <th className='px-4 py-3'>Assignee</th>
                  <th className='px-4 py-3'>Updated</th>
                </tr>
              </thead>
              <tbody>
                {sortedIssues.map((issue) => {
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

          <div className='flex flex-col gap-4 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
              <span>
                Showing {pageStart}-{pageEnd} of {totalCount}
              </span>
              <InputDropdown
                options={[
                  { value: '10', label: '10 / page' },
                  { value: '20', label: '20 / page' },
                  { value: '50', label: '50 / page' },
                ]}
                value={String(pageSize)}
                onChange={(value) => {
                  const nextPageSize = Number(value);

                  const next = {
                    organization_id: organizationId,
                    team_id: teamId,
                    status,
                    type,
                    assignee,
                    page: 1,
                    pageSize: nextPageSize,
                    sort,
                  };

                  setPageSize(nextPageSize);
                  setPage(1);
                  fetchPage(next);
                }}
                className='w-[160px]'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant={BUTTON_VARIANT.secondary}
                className='w-auto px-3'
                disabled={page <= 1 || isPending}
                onClick={() => {
                  const next = {
                    organization_id: organizationId,
                    team_id: teamId,
                    status,
                    type,
                    assignee,
                    page: page - 1,
                    pageSize,
                    sort,
                  };

                  setPage((current) => {
                    return current - 1;
                  });
                  fetchPage(next);
                }}
              >
                <ChevronLeft className='h-4 w-4' />
                Prev
              </Button>
              <span className='px-2 text-sm text-muted-foreground'>
                Page {page} / {totalPages}
              </span>
              <Button
                type='button'
                variant={BUTTON_VARIANT.secondary}
                className='w-auto px-3'
                disabled={page >= totalPages || isPending}
                onClick={() => {
                  const next = {
                    organization_id: organizationId,
                    team_id: teamId,
                    status,
                    type,
                    assignee,
                    page: page + 1,
                    pageSize,
                    sort,
                  };

                  setPage((current) => {
                    return current + 1;
                  });
                  fetchPage(next);
                }}
              >
                Next
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4 text-xs text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          Sorting is applied on the current page; pagination and filters are
          backed by the API via `offset`/`limit`.
        </div>
      </div>
    </div>
  );
}
