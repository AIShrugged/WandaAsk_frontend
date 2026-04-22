'use client';

import { useFiltersContext } from '@/features/issues/model/filters-context';
import { IssuesPage } from '@/features/issues/ui/issues-page';

import type { Issue, PersonOption } from '@/features/issues/model/types';

interface IssuesListTabProps {
  initialIssues: Issue[];
  initialTotalCount: number;
  persons: PersonOption[];
}

/**
 * IssuesListTab — client wrapper that reads filter context and renders IssuesPage.
 */
export function IssuesListTab({
  initialIssues,
  initialTotalCount,
  persons,
}: IssuesListTabProps) {
  const {
    filters,
    filtersVersion,
    initialSort,
    initialOrder,
    setShowArchived,
  } = useFiltersContext();

  return (
    <IssuesPage
      initialIssues={initialIssues}
      initialTotalCount={initialTotalCount}
      persons={persons}
      filters={filters}
      filtersVersion={filtersVersion}
      initialSort={initialSort}
      initialOrder={initialOrder}
      onShowArchivedChange={setShowArchived}
    />
  );
}
