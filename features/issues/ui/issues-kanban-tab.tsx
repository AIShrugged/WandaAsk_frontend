'use client';

import { useFiltersContext } from '@/features/issues/model/filters-context';
import { KanbanBoard } from '@/features/kanban';

import type { OrganizationProps } from '@/entities/organization';
import type { PersonOption } from '@/features/issues/model/types';
import type { IssueStatus, KanbanCard } from '@/features/kanban/model/types';

interface IssuesKanbanTabProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
}

/**
 * IssuesKanbanTab — client wrapper that reads filter context and renders KanbanBoard.
 */
export function IssuesKanbanTab({
  initialColumns,
  organizations,
  persons,
}: IssuesKanbanTabProps) {
  const { filters, columnsVersion } = useFiltersContext();

  return (
    <div className='flex-1 overflow-hidden p-3 h-full'>
      <KanbanBoard
        initialColumns={initialColumns}
        organizations={organizations}
        persons={persons}
        filters={filters}
        columnsVersion={columnsVersion}
      />
    </div>
  );
}
