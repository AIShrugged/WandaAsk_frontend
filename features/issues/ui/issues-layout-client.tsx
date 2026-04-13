'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { FiltersContext } from '@/features/issues/model/filters-context';
import {
  isIssueStatus,
  ISSUE_TYPE_OPTIONS,
} from '@/features/issues/model/types';
import { IssuesTabsNav } from '@/features/issues/ui/issues-tabs-nav';
import { SharedFiltersBar } from '@/features/issues/ui/shared-filters-bar';

import type { OrganizationProps } from '@/entities/organization';
import type {
  IssueSortField,
  IssueType,
  PersonOption,
  SharedFilters,
  SortOrder,
} from '@/features/issues/model/types';

interface IssuesLayoutClientProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  currentUserId: number | null;
  children: React.ReactNode;
}

const KEEP_WHEN_EMPTY = new Set(['assignee_id']);
const STALE_PARAMS = ['assignee'] as const;

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
 * IssuesLayoutClient — client component that owns filter state and URL sync
 * for the issues section. Provides filters via context to sub-route pages.
 * Filter state is initialized from URL search params on mount.
 */
export function IssuesLayoutClient({
  organizations,
  persons,
  currentUserId,
  children,
}: IssuesLayoutClientProps) {
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
      organization_id: searchParams.get('organization_id') ?? '',
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
        <div className='px-2 pt-4 shrink-0'>
          <SharedFiltersBar
            filters={filters}
            organizations={organizations}
            persons={persons}
            onChange={handleFiltersChange}
          />
        </div>
        <div className='shrink-0 mt-4'>
          <IssuesTabsNav />
        </div>
        <div className='flex-1 overflow-hidden'>{children}</div>
      </div>
    </FiltersContext.Provider>
  );
}
