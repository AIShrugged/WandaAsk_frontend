import { render, screen } from '@testing-library/react';

import {
  FiltersContext,
  type FiltersContextValue,
} from '@/features/issues/model/filters-context';
import { IssuesListTab } from '@/features/issues/ui/issues-list-tab';

import type { Issue, PersonOption } from '@/features/issues/model/types';

jest.mock('@/features/issues/ui/issues-page', () => {
  return {
    IssuesPage: (props: {
      filters: Record<string, unknown>;
      filtersVersion: number;
      initialSort: string;
      initialOrder: string;
      initialIssues: Issue[];
      initialTotalCount: number;
      persons: PersonOption[];
    }) => {
      return (
        <div
          data-testid='issues-page'
          data-filters={JSON.stringify(props.filters)}
          data-filters-version={props.filtersVersion}
          data-sort={props.initialSort}
          data-order={props.initialOrder}
        />
      );
    },
  };
});

const defaultContext: FiltersContextValue = {
  filters: {
    organization_id: '',
    team_id: '',
    search: '',
    type: '',
    assignee_id: '',
    priority: '',
    status: '',
  },
  filtersVersion: 3,
  columnsVersion: 0,
  initialSort: 'id',
  initialOrder: 'asc',
};

function renderWithContext(ctx: FiltersContextValue = defaultContext) {
  return render(
    <FiltersContext.Provider value={ctx}>
      <IssuesListTab initialIssues={[]} initialTotalCount={0} persons={[]} />
    </FiltersContext.Provider>,
  );
}

describe('IssuesListTab', () => {
  it('renders without crashing when context is provided', () => {
    renderWithContext();
    expect(screen.getByTestId('issues-page')).toBeInTheDocument();
  });

  it('passes filters from context to IssuesPage', () => {
    const ctx: FiltersContextValue = {
      ...defaultContext,
      filters: {
        organization_id: '7',
        team_id: '2',
        search: 'auth',
        type: 'development',
        assignee_id: '5',
        priority: 'high',
        status: 'open',
      },
    };

    renderWithContext(ctx);

    const page = screen.getByTestId('issues-page');
    const filters = JSON.parse(page.dataset.filters ?? '{}');

    expect(filters.organization_id).toBe('7');
    expect(filters.search).toBe('auth');
    expect(filters.type).toBe('development');
  });

  it('passes filtersVersion from context to IssuesPage', () => {
    renderWithContext({ ...defaultContext, filtersVersion: 12 });
    const page = screen.getByTestId('issues-page');
    expect(page.dataset.filtersVersion).toBe('12');
  });

  it('passes initialSort and initialOrder from context', () => {
    renderWithContext({
      ...defaultContext,
      initialSort: 'name',
      initialOrder: 'asc',
    });
    const page = screen.getByTestId('issues-page');
    expect(page.dataset.sort).toBe('name');
    expect(page.dataset.order).toBe('asc');
  });
});
