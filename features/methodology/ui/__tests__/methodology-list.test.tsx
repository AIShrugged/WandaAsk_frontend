import { render, screen } from '@testing-library/react';

import MethodologyList from '@/features/methodology/ui/methodology-list';

import type { MethodologyProps } from '@/features/methodology/model/types';

jest.mock('@/features/methodology/api/methodology', () => {
  return {
    loadMethodologiesChunk: jest.fn(),
  };
});

jest.mock('@/features/methodology/model/methodology-store', () => {
  function store(
    selector: (state: { items: MethodologyProps[] | null }) => unknown,
  ) {
    return selector({ items: [] });
  }

  store.getState = () => {
    return { items: [], cacheKey: null };
  };

  return { useMethodologyStore: store };
});

jest.mock('@/features/methodology/ui/methodology-item', () => {
  return {
    __esModule: true,
    default: ({ methodology }: { methodology: MethodologyProps }) => {
      return <div data-testid='methodology-item'>{methodology.name}</div>;
    },
  };
});

jest.mock('@/shared/ui/layout/spin-loader', () => {
  return {
    __esModule: true,
    default: () => {
      return <div data-testid='spin-loader' />;
    },
  };
});

jest.mock('@/shared/ui/layout/infinite-scroll-status', () => {
  return {
    InfiniteScrollStatus: ({ itemCount }: { itemCount: number }) => {
      return <div data-testid='scroll-status'>loaded:{itemCount}</div>;
    },
  };
});

// Controllable mock for useCachedInfiniteScroll
let mockScrollResult: {
  items: MethodologyProps[] | null;
  isLoading: boolean;
  hasMore: boolean;
  sentinelRef: { current: null };
} | null = null;

jest.mock('@/shared/hooks/use-cached-infinite-scroll', () => {
  return {
    useCachedInfiniteScroll: (opts: {
      initialItems: MethodologyProps[];
      totalCount: number;
    }) => {
      if (mockScrollResult !== null) {
        return mockScrollResult;
      }

      // Default: pass-through
      return {
        items: opts.initialItems,
        isLoading: false,
        hasMore: opts.initialItems.length < opts.totalCount,
        sentinelRef: { current: null },
      };
    },
  };
});

const makeMethodology = (id: number): MethodologyProps => {
  return {
    id,
    name: `Methodology ${id}`,
    text: `Content ${id}`,
    organization_id: '1',
    team_ids: [],
    is_default: false,
    teams: [],
  };
};

describe('MethodologyList', () => {
  beforeEach(() => {
    mockScrollResult = null;
  });

  it('renders each methodology item', () => {
    const methodologies = [makeMethodology(1), makeMethodology(2)];

    render(
      <MethodologyList
        initialMethodologies={methodologies}
        totalCount={2}
        organizationId='1'
      />,
    );

    expect(screen.getAllByTestId('methodology-item')).toHaveLength(2);
    expect(screen.getByText('Methodology 1')).toBeInTheDocument();
    expect(screen.getByText('Methodology 2')).toBeInTheDocument();
  });

  it('renders InfiniteScrollStatus when all items loaded', () => {
    const methodologies = [makeMethodology(1)];

    render(
      <MethodologyList
        initialMethodologies={methodologies}
        totalCount={1}
        organizationId='1'
      />,
    );

    expect(screen.getByTestId('scroll-status')).toHaveTextContent('loaded:1');
  });

  it('does not show status when there are more items to load', () => {
    const methodologies = [makeMethodology(1)];

    render(
      <MethodologyList
        initialMethodologies={methodologies}
        totalCount={10}
        organizationId='1'
      />,
    );

    expect(screen.queryByTestId('scroll-status')).not.toBeInTheDocument();
  });

  it('returns null when items is null', () => {
    mockScrollResult = {
      items: null,
      isLoading: false,
      hasMore: false,
      sentinelRef: { current: null },
    };

    const { container } = render(
      <MethodologyList
        initialMethodologies={[]}
        totalCount={0}
        organizationId='1'
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders empty list without errors', () => {
    render(
      <MethodologyList
        initialMethodologies={[]}
        totalCount={0}
        organizationId='1'
      />,
    );

    expect(screen.queryByTestId('methodology-item')).not.toBeInTheDocument();
  });
});
