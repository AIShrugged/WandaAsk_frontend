import { render, screen } from '@testing-library/react';

import { AgentActivityFeed } from '@/features/agents/ui/agent-activity-feed';

jest.mock('@/features/agents/api/activity', () => {
  return {
    getAgentActivity: jest.fn(),
  };
});

jest.mock('@/shared/hooks/use-infinite-scroll', () => {
  return {
    /**
     *
     * @param root0
     * @param root0.initialItems
     * @param root0.initialHasMore
     */
    useInfiniteScroll: ({
      initialItems,
      initialHasMore,
    }: {
      initialItems: unknown[];
      initialHasMore: boolean;
    }) => {
      return {
        items: initialItems,
        isLoading: false,
        hasMore: initialHasMore,
        sentinelRef: { current: null },
      };
    },
  };
});

describe('AgentActivityFeed', () => {
  it('renders activity items', () => {
    render(
      <AgentActivityFeed
        initialItems={[
          {
            id: 1,
            tool_name: 'create_artifact',
            description: 'Created an artifact',
            success: true,
            agent_run_uuid: '550e8400-e29b-41d4-a716-446655440000',
            created_at: '2026-03-24T14:00:00.000000Z',
          },
        ]}
        totalCount={1}
      />,
    );

    expect(screen.getByText('Created an artifact')).toBeInTheDocument();
    expect(screen.getByText('create_artifact')).toBeInTheDocument();
    expect(screen.getByText('Run: 550e8400…0000')).toBeInTheDocument();
  });

  it('renders an empty state when there are no items', () => {
    render(<AgentActivityFeed initialItems={[]} totalCount={0} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No agent activity yet')).toBeInTheDocument();
  });
});
