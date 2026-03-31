'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { IssuesPage } from '@/features/issues/ui/issues-page';
import { SharedFiltersBar } from '@/features/issues/ui/shared-filters-bar';
import { KanbanBoard } from '@/features/kanban';

import type { OrganizationProps } from '@/entities/organization';
import type {
  Issue,
  IssueSortField,
  IssueStatus,
  PersonOption,
  SharedFilters,
  SortOrder,
} from '@/features/issues/model/types';
import type {
  IssueStatus as KanbanIssueStatus,
  KanbanCard,
} from '@/features/kanban/model/types';

const TABS = [
  { id: 'tasktracker', label: 'Tasktracker' },
  { id: 'kanban', label: 'Kanban' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const KEEP_WHEN_EMPTY = new Set(['assignee_id']);

interface TasktrackerTabsProps {
  organizations: OrganizationProps[];
  persons: PersonOption[];
  initialIssues: Issue[];
  initialTotalCount: number;
  initialColumns: Record<KanbanIssueStatus, KanbanCard[]>;
  initialFilters: SharedFilters;
  initialSort: IssueSortField;
  initialOrder: SortOrder;
  initialStatus: IssueStatus | '';
}

/**
 * TasktrackerTabs client component.
 * Owns shared filter state and URL synchronization.
 * Renders a shared filter bar above the tab strip, then passes filters down to each tab.
 * @param props - component props.
 * @returns JSX element.
 */
export function TasktrackerTabs({
  organizations,
  persons,
  initialIssues,
  initialTotalCount,
  initialColumns,
  initialFilters,
  initialSort,
  initialOrder,
  initialStatus,
}: TasktrackerTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabId>('tasktracker');
  const [filters, setFilters] = useState<SharedFilters>(initialFilters);
  const [filtersVersion, setFiltersVersion] = useState(0);

  // columnsVersion tracks when server re-fetched kanban data
  // We increment it whenever URL changes (which triggers SSR re-fetch → new initialColumns)
  const columnsVersionRef = useRef(0);
  const [columnsVersion, setColumnsVersion] = useState(0);

  const updateUrl = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

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

  const handleFiltersChange = useCallback(
    (patch: Partial<SharedFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };

        updateUrl({
          organization_id: next.organization_id,
          team_id: next.team_id,
          search: next.search,
          type: next.type,
          assignee_id: next.assignee_id,
          priority: next.priority,
        });

        return next;
      });

      setFiltersVersion((v) => {
        return v + 1;
      });

      columnsVersionRef.current += 1;
      setColumnsVersion(columnsVersionRef.current);
    },
    [updateUrl],
  );

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {/* Shared filter bar — always visible regardless of active tab */}
      <div className='px-4 pt-4 shrink-0'>
        <SharedFiltersBar
          filters={filters}
          organizations={organizations}
          persons={persons}
          onChange={handleFiltersChange}
        />
      </div>

      {/* Tab bar */}
      <div className='flex gap-1 border-b border-border shrink-0 mt-4'>
        {TABS.map((tab) => {
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={[
                'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className='flex-1 overflow-hidden'>
        {activeTab === 'tasktracker' && (
          <div className='h-full overflow-y-auto px-4 py-4'>
            <IssuesPage
              initialIssues={initialIssues}
              initialTotalCount={initialTotalCount}
              persons={persons}
              filters={filters}
              filtersVersion={filtersVersion}
              initialSort={initialSort}
              initialOrder={initialOrder}
              initialStatus={initialStatus}
            />
          </div>
        )}
        {activeTab === 'kanban' && (
          <div className='flex-1 overflow-hidden p-3 h-full'>
            <KanbanBoard
              initialColumns={initialColumns}
              organizations={organizations}
              persons={persons}
              filters={filters}
              columnsVersion={columnsVersion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
