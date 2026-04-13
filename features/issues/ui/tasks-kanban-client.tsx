'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { FiltersContext } from '@/features/issues/model/filters-context';
import {
  isIssueStatus,
  ISSUE_STATUS_OPTIONS,
  ISSUE_TYPE_OPTIONS,
} from '@/features/issues/model/types';
import { fetchKanbanIssues, KanbanBoard } from '@/features/kanban';
import { getTeams } from '@/features/teams/api/team';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { TenantScopeFields } from '@/shared/ui/input/tenant-scope-fields';

import type { OrganizationProps } from '@/entities/organization';
import type {
  IssueSortField,
  IssueType,
  PersonOption,
  SharedFilters,
  SortOrder,
} from '@/features/issues/model/types';
import type {
  IssueStatus,
  KanbanCard,
  KanbanFilters,
} from '@/features/kanban/model/types';

interface TasksKanbanClientProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
  currentUserId: number | null;
  initialOrgId: string;
}

const KEEP_WHEN_EMPTY = new Set(['assignee_id']);
const STALE_PARAMS = ['assignee'] as const;

const TYPE_OPTIONS = [
  { value: '', label: 'Any type' },
  { value: 'development', label: 'Development' },
  { value: 'organization', label: 'Organization' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  ...ISSUE_STATUS_OPTIONS,
];

const VALID_SORT_FIELDS = new Set<IssueSortField>([
  'id',
  'name',
  'type',
  'status',
  'updated_at',
  'created_at',
]);

function isIssueSortField(value: string): value is IssueSortField {
  return VALID_SORT_FIELDS.has(value as IssueSortField);
}

function isSortOrder(value: string): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

function isIssueType(value: string): value is IssueType {
  return ISSUE_TYPE_OPTIONS.some((option) => {
    return option.value === value;
  });
}

/**
 * TasksKanbanClient — self-contained client component for the tasks/kanban page.
 * Owns filter state and URL sync, renders filters bar + KanbanBoard.
 */
export function TasksKanbanClient({
  initialColumns,
  organizations,
  persons,
  currentUserId,
  initialOrgId,
}: TasksKanbanClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Lazy state init from URL params — runs only on first render.
  // When assignee_id is absent from URL, default to the current user.
  const [initialFilters] = useState<SharedFilters>(() => {
    const statusRaw = searchParams.get('status') ?? '';
    const typeRaw = searchParams.get('type') ?? '';
    const assigneeIdRaw = searchParams.has('assignee_id')
      ? (searchParams.get('assignee_id') ?? '')
      : (currentUserId?.toString() ?? '');

    return {
      organization_id: searchParams.get('organization_id') ?? initialOrgId,
      team_id: searchParams.get('team_id') ?? '',
      search: searchParams.get('search') ?? '',
      type: isIssueType(typeRaw) ? typeRaw : '',
      assignee_id: assigneeIdRaw,
      status: isIssueStatus(statusRaw) ? statusRaw : '',
    };
  });

  const [initialSort] = useState<IssueSortField>(() => {
    const raw = searchParams.get('sort') ?? '';

    return isIssueSortField(raw) ? raw : 'created_at';
  });

  const [initialOrder] = useState<SortOrder>(() => {
    const raw = searchParams.get('order') ?? '';

    return isSortOrder(raw) ? raw : 'desc';
  });

  const [filters, setFilters] = useState<SharedFilters>(initialFilters);
  const [filtersVersion, setFiltersVersion] = useState(0);
  const columnsVersionRef = useRef(0);
  const [columnsVersion, setColumnsVersion] = useState(0);
  const isFirstFiltersRender = useRef(true);

  const [columns, setColumns] =
    useState<Record<IssueStatus, KanbanCard[]>>(initialColumns);
  const [isFetching, setIsFetching] = useState(false);
  const fetchCounterRef = useRef(0);
  const prevSearchRef = useRef(filters.search);

  // On mount: remove stale legacy params and write default assignee_id if absent.
  useEffect(() => {
    const current = new URLSearchParams(searchParams.toString());
    let dirty = false;

    for (const stale of STALE_PARAMS) {
      if (current.has(stale)) {
        current.delete(stale);
        dirty = true;
      }
    }

    if (!searchParams.has('organization_id') && initialOrgId) {
      current.set('organization_id', initialOrgId);
      dirty = true;
    }

    if (!searchParams.has('assignee_id') && currentUserId !== null) {
      current.set('assignee_id', String(currentUserId));
      dirty = true;
    }

    if (dirty) {
      router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    }
  }, []);

  const updateUrl = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const stale of STALE_PARAMS) {
        params.delete(stale);
      }

      for (const [key, value] of Object.entries(patch)) {
        if (value || KEEP_WHEN_EMPTY.has(key)) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleFiltersChange = useCallback((patch: Partial<SharedFilters>) => {
    setFilters((prev) => {
      return { ...prev, ...patch };
    });
    setFiltersVersion((v) => {
      return v + 1;
    });
    columnsVersionRef.current += 1;
    setColumnsVersion(columnsVersionRef.current);
  }, []);

  useEffect(() => {
    if (isFirstFiltersRender.current) {
      isFirstFiltersRender.current = false;
      return;
    }

    updateUrl({
      organization_id: filters.organization_id,
      team_id: filters.team_id,
      search: filters.search,
      type: filters.type,
      assignee_id: filters.assignee_id,
      status: filters.status,
    });
  }, [filters]);

  useEffect(() => {
    if (isFirstFiltersRender.current) return;

    const thisCall = ++fetchCounterRef.current;
    const isSearchChange = filters.search !== prevSearchRef.current;
    prevSearchRef.current = filters.search;

    const run = async () => {
      setIsFetching(true);

      const kanbanFilters: KanbanFilters = {
        organization_id: filters.organization_id
          ? Number(filters.organization_id)
          : null,
        team_id: filters.team_id ? Number(filters.team_id) : null,
        type: filters.type || undefined,
        assignee_id: filters.assignee_id ? Number(filters.assignee_id) : null,
      };

      const result = await fetchKanbanIssues(kanbanFilters);

      if (thisCall !== fetchCounterRef.current) return;

      if (result.error === null) {
        setColumns(result.data);
        columnsVersionRef.current += 1;
        setColumnsVersion(columnsVersionRef.current);
      } else {
        toast.error(result.error);
      }

      setIsFetching(false);
    };

    const delay = isSearchChange ? 300 : 0;
    const timer = setTimeout(run, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [filters]);

  const personOptions = [
    { value: '', label: 'Any assignee' },
    ...persons.map((person) => {
      return {
        value: String(person.id),
        label: person.email ? `${person.name} (${person.email})` : person.name,
      };
    }),
  ];

  return (
    <FiltersContext.Provider
      value={{
        filters,
        filtersVersion,
        columnsVersion,
        initialSort,
        initialOrder,
      }}
    >
      <div className='flex flex-col h-full overflow-hidden'>
        <div className='px-4 pt-3 shrink-0'>
          <div className='grid gap-3 rounded-[var(--radius-card)] border border-border bg-card p-3'>
            <TenantScopeFields
              organizations={organizations}
              organizationId={filters.organization_id}
              teamId={filters.team_id}
              fetchTeams={getTeams}
              onOrganizationChange={(value) => {
                handleFiltersChange({ organization_id: value, team_id: '' });
              }}
              onTeamChange={(value) => {
                handleFiltersChange({ team_id: value });
              }}
              disabled={isFetching}
            />
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                <input
                  type='text'
                  placeholder='Search by name...'
                  value={filters.search}
                  onChange={(e) => {
                    handleFiltersChange({ search: e.target.value });
                  }}
                  className='h-9 w-full rounded-[var(--radius-button)] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
                />
              </div>
              <InputDropdown
                label='Status'
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={(value) => {
                  handleFiltersChange({ status: value as IssueStatus | '' });
                }}
                disabled={isFetching}
              />
              <InputDropdown
                label='Type'
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={(value) => {
                  handleFiltersChange({ type: value as IssueType | '' });
                }}
                disabled={isFetching}
              />
              <InputDropdown
                label='Assignee'
                options={personOptions}
                value={filters.assignee_id}
                onChange={(value) => {
                  handleFiltersChange({
                    assignee_id: Array.isArray(value) ? value[0] : value,
                  });
                }}
                searchable
                disabled={isFetching}
              />
            </div>
          </div>
        </div>
        <div
          className={`flex-1 overflow-hidden p-3 h-full transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}
        >
          <KanbanBoard
            initialColumns={columns}
            organizations={organizations}
            persons={persons}
            filters={filters}
            columnsVersion={columnsVersion}
          />
        </div>
      </div>
    </FiltersContext.Provider>
  );
}
