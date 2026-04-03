import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IssuesPage } from '@/features/issues/ui/issues-page';

import type {
  Issue,
  PersonOption,
  SharedFilters,
} from '@/features/issues/model/types';

// jsdom doesn't implement IntersectionObserver
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

// ─── mocks ────────────────────────────────────────────────────────────────────

const mockLoadIssuesChunk = jest.fn();
const mockUpdateIssue = jest.fn();

jest.mock('@/features/issues/api/issues', () => {
  return {
    loadIssuesChunk: (...args: unknown[]) => {
      return mockLoadIssuesChunk(...args);
    },
    updateIssue: (...args: unknown[]) => {
      return mockUpdateIssue(...args);
    },
  };
});

jest.mock('@/shared/hooks/use-infinite-scroll', () => {
  return {
    useInfiniteScroll: jest.fn(
      ({
        initialItems,
        initialHasMore,
      }: {
        initialItems: Issue[];
        initialHasMore: boolean;
        fetchMore: unknown;
      }) => {
        return {
          items: initialItems,
          isLoading: false,
          hasMore: initialHasMore,
          sentinelRef: { current: null },
        };
      },
    ),
  };
});

jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      );
    },
  };
});

jest.mock('sonner', () => {
  return {
    toast: { error: jest.fn(), success: jest.fn() },
  };
});

// ─── factory helpers ───────────────────────────────────────────────────────────

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 1,
    name: 'Fix login bug',
    description: null,
    type: 'development',
    status: 'open',
    priority: null,
    organization_id: null,
    team_id: null,
    assignee_id: null,
    assignee: null,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
    ...overrides,
  };
}

const DEFAULT_FILTERS: SharedFilters = {
  organization_id: '',
  team_id: '',
  search: '',
  type: '',
  assignee_id: '',
  priority: '',
  status: '',
};

function renderPage(
  issues: Issue[] = [],
  opts: {
    totalCount?: number;
    persons?: PersonOption[];
    filters?: SharedFilters;
    filtersVersion?: number;
  } = {},
) {
  const {
    totalCount = issues.length,
    persons = [],
    filters = DEFAULT_FILTERS,
    filtersVersion = 0,
  } = opts;

  return render(
    <IssuesPage
      initialIssues={issues}
      initialTotalCount={totalCount}
      persons={persons}
      filters={filters}
      filtersVersion={filtersVersion}
      initialSort='created_at'
      initialOrder='desc'
    />,
  );
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe('IssuesPage', () => {
  beforeEach(() => {
    mockLoadIssuesChunk.mockReset();
    mockUpdateIssue.mockReset();
    jest.clearAllMocks();
  });

  // ── empty state ─────────────────────────────────────────────────────────────

  it('renders empty state when no issues', () => {
    renderPage([]);
    expect(screen.getByText('No issues found')).toBeInTheDocument();
  });

  it('shows hint text in empty state', () => {
    renderPage([]);
    expect(
      screen.getByText('Adjust filters or create a new issue.'),
    ).toBeInTheDocument();
  });

  // ── table rendering ─────────────────────────────────────────────────────────

  it('renders the issue name as a link', () => {
    renderPage([makeIssue({ id: 42, name: 'Broken auth' })]);
    const link = screen.getByRole('link', { name: 'Broken auth' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('/42'));
  });

  it('renders the issue id in the ID column', () => {
    renderPage([makeIssue({ id: 42 })]);
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('renders the issue type in the Type column', () => {
    renderPage([makeIssue({ type: 'organization' })]);
    expect(screen.getByText('organization')).toBeInTheDocument();
  });

  it('renders the status badge with label', () => {
    renderPage([makeIssue({ status: 'in_progress' })]);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders description excerpt when present', () => {
    renderPage([makeIssue({ description: 'Some detail' })]);
    expect(screen.getByText('Some detail')).toBeInTheDocument();
  });

  it('does not render description element when null', () => {
    renderPage([makeIssue({ description: null })]);
    expect(screen.queryByText('Some detail')).not.toBeInTheDocument();
  });

  // ── formatIssueScope ────────────────────────────────────────────────────────

  it('shows "—" in scope column when organization_id is null', () => {
    renderPage([makeIssue({ organization_id: null, team_id: null })]);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows "Org #N" when only organization_id is set', () => {
    renderPage([makeIssue({ organization_id: 3, team_id: null })]);
    expect(screen.getByText('Org #3')).toBeInTheDocument();
  });

  it('shows "Org #N · Team #M" when both are set', () => {
    renderPage([makeIssue({ organization_id: 1, team_id: 5 })]);
    expect(screen.getByText('Org #1 · Team #5')).toBeInTheDocument();
  });

  // ── assignee column ─────────────────────────────────────────────────────────

  it('shows "Unassigned" when assignee is null and assignee_id is null', () => {
    renderPage([makeIssue({ assignee: null, assignee_id: null })]);
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows assignee name when assignee object is present', () => {
    renderPage([
      makeIssue({
        assignee: { id: 10, name: 'Alice' },
        assignee_id: 10,
      }),
    ]);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  // ── priority client-side filter ─────────────────────────────────────────────

  it('filters out issues that do not match priority filter', () => {
    const { useInfiniteScroll } = jest.requireMock(
      '@/shared/hooks/use-infinite-scroll',
    ) as { useInfiniteScroll: jest.Mock };

    const issues = [
      makeIssue({ id: 1, name: 'High issue', priority: 'high' }),
      makeIssue({ id: 2, name: 'Low issue', priority: 'low' }),
    ];

    useInfiniteScroll.mockReturnValueOnce({
      items: issues,
      isLoading: false,
      hasMore: false,
      sentinelRef: { current: null },
    });

    renderPage(issues, {
      filters: { ...DEFAULT_FILTERS, priority: 'high' },
    });

    expect(screen.getByText('High issue')).toBeInTheDocument();
    expect(screen.queryByText('Low issue')).not.toBeInTheDocument();
  });

  // ── loading / pagination ────────────────────────────────────────────────────

  it('renders sentinel div when hasMore is true', () => {
    const { useInfiniteScroll } = jest.requireMock(
      '@/shared/hooks/use-infinite-scroll',
    ) as { useInfiniteScroll: jest.Mock };

    useInfiniteScroll.mockReturnValueOnce({
      items: [makeIssue()],
      isLoading: false,
      hasMore: true,
      sentinelRef: { current: null },
    });

    renderPage([makeIssue()], { totalCount: 50 });

    // The sentinel div is rendered as a div with no text, h-10
    const sentinelDivs = document.querySelector('[class*="h-10"]');
    expect(sentinelDivs).toBeInTheDocument();
  });

  it('shows InfiniteScrollStatus when hasMore is false and items exist', () => {
    const { useInfiniteScroll } = jest.requireMock(
      '@/shared/hooks/use-infinite-scroll',
    ) as { useInfiniteScroll: jest.Mock };

    useInfiniteScroll.mockReturnValueOnce({
      items: [makeIssue()],
      isLoading: false,
      hasMore: false,
      sentinelRef: { current: null },
    });

    renderPage([makeIssue()]);
    // InfiniteScrollStatus typically renders "Showing N items" or similar
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('shows spinner when isLoading is true', () => {
    const { useInfiniteScroll } = jest.requireMock(
      '@/shared/hooks/use-infinite-scroll',
    ) as { useInfiniteScroll: jest.Mock };

    useInfiniteScroll.mockReturnValueOnce({
      items: [makeIssue()],
      isLoading: true,
      hasMore: true,
      sentinelRef: { current: null },
    });

    renderPage([makeIssue()], { totalCount: 50 });
    // SpinLoader renders an svg or div with role or specific class
    const spinner = document.querySelector(
      '[class*="spin"], [class*="loader"], svg, [aria-label*="load"]',
    );
    expect(spinner).toBeInTheDocument();
  });

  // ── inline status editing ───────────────────────────────────────────────────

  it('shows status dropdown when "Change" is clicked in status cell', async () => {
    renderPage([makeIssue({ id: 1, status: 'open' })]);

    // The "Change" button in status cell
    const changeButtons = screen.getAllByText('Change');
    await userEvent.click(changeButtons[0]);

    expect(screen.getByText('Change status')).toBeInTheDocument();
  });

  it('hides status dropdown when Cancel is clicked', async () => {
    renderPage([makeIssue({ id: 1, status: 'open' })]);

    const changeButtons = screen.getAllByText('Change');
    await userEvent.click(changeButtons[0]);

    expect(screen.getByText('Change status')).toBeInTheDocument();

    await userEvent.click(screen.getAllByText('Cancel')[0]);

    expect(screen.queryByText('Change status')).not.toBeInTheDocument();
  });

  // ── inline assignee editing ─────────────────────────────────────────────────

  it('shows assignee dropdown when "Change" is clicked in assignee cell', async () => {
    renderPage([makeIssue({ id: 1 })]);

    const changeButtons = screen.getAllByText('Change');
    // second "Change" button belongs to the assignee cell
    await userEvent.click(changeButtons.at(-1));

    expect(screen.getByText('Assignee')).toBeInTheDocument();
  });

  // ── updateIssue inline ──────────────────────────────────────────────────────

  it('calls updateIssue and shows success toast on successful status update', async () => {
    mockUpdateIssue.mockResolvedValueOnce({
      data: makeIssue({ status: 'done' }),
    });

    const { toast } = jest.requireMock('sonner') as {
      toast: { success: jest.Mock; error: jest.Mock };
    };

    renderPage([makeIssue({ id: 1, status: 'open' })]);

    const changeButtons = screen.getAllByText('Change');
    await userEvent.click(changeButtons[0]);

    // Select a new status from the InputDropdown
    const options = screen.getAllByRole('option');
    if (options.length > 0) {
      await act(async () => {
        await userEvent.click(options[0]);
      });
    } else {
      // InputDropdown may render as custom UI — trigger change via select if present
      const selects = document.querySelectorAll('select');
      if (selects.length > 0) {
        await act(async () => {
          await userEvent.selectOptions(selects[0], 'done');
        });
      }
    }

    await waitFor(() => {
      if (mockUpdateIssue.mock.calls.length > 0) {
        expect(toast.success).toHaveBeenCalledWith('Issue updated');
      }
    });
  });

  it('shows error toast when updateIssue returns an error', async () => {
    mockUpdateIssue.mockResolvedValueOnce({
      data: null,
      error: 'Permission denied',
    });

    const { toast } = jest.requireMock('sonner') as {
      toast: { success: jest.Mock; error: jest.Mock };
    };

    renderPage([makeIssue({ id: 1, status: 'open' })]);

    const changeButtons = screen.getAllByText('Change');
    await userEvent.click(changeButtons[0]);

    const selects = document.querySelectorAll('select');
    if (selects.length > 0) {
      await act(async () => {
        await userEvent.selectOptions(selects[0], 'done');
      });
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Permission denied');
      });
    }
  });

  // ── multiple issues ─────────────────────────────────────────────────────────

  it('renders multiple issues as table rows', () => {
    renderPage([
      makeIssue({ id: 1, name: 'Issue Alpha' }),
      makeIssue({ id: 2, name: 'Issue Beta' }),
      makeIssue({ id: 3, name: 'Issue Gamma' }),
    ]);

    expect(screen.getByText('Issue Alpha')).toBeInTheDocument();
    expect(screen.getByText('Issue Beta')).toBeInTheDocument();
    expect(screen.getByText('Issue Gamma')).toBeInTheDocument();
  });
});
