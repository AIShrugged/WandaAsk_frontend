import { useTeamsStore } from '@/features/teams/model/teams-store';

describe('useTeamsStore', () => {
  beforeEach(() => {
    useTeamsStore.getState().invalidate();
  });

  it('has empty items by default', () => {
    expect(useTeamsStore.getState().items).toEqual([]);
  });

  it('has zero totalCount by default', () => {
    expect(useTeamsStore.getState().totalCount).toBe(0);
  });

  it('is not loading by default', () => {
    expect(useTeamsStore.getState().isLoading).toBe(false);
  });

  it('hydrate sets items and totalCount', () => {
    const items = [
      { id: 1, name: 'Alpha', slug: 'alpha', employee_count: 3, members: [] },
    ];

    useTeamsStore.getState().hydrate(items, 1, 'key-1');
    const state = useTeamsStore.getState();

    expect(state.items).toEqual(items);
    expect(state.totalCount).toBe(1);
    expect(state.cacheKey).toBe('key-1');
  });

  it('setLoading updates isLoading', () => {
    useTeamsStore.getState().setLoading(true);
    expect(useTeamsStore.getState().isLoading).toBe(true);
    useTeamsStore.getState().setLoading(false);
    expect(useTeamsStore.getState().isLoading).toBe(false);
  });

  it('invalidate resets to initial state', () => {
    useTeamsStore
      .getState()
      .hydrate(
        [{ id: 1, name: 'T', slug: 't', employee_count: 1, members: [] }],
        1,
        'k',
      );
    useTeamsStore.getState().invalidate();
    expect(useTeamsStore.getState().items).toEqual([]);
    expect(useTeamsStore.getState().totalCount).toBe(0);
    expect(useTeamsStore.getState().cacheKey).toBeNull();
  });

  it('appendChunk adds items to existing list', () => {
    const first = [
      { id: 1, name: 'A', slug: 'a', employee_count: 1, members: [] },
    ];
    const second = [
      { id: 2, name: 'B', slug: 'b', employee_count: 2, members: [] },
    ];

    useTeamsStore.getState().hydrate(first, 2, 'k');
    useTeamsStore.getState().appendChunk(second, false);
    expect(useTeamsStore.getState().items).toHaveLength(2);
    expect(useTeamsStore.getState().hasMore).toBe(false);
  });

  it('removeItem removes by id', () => {
    useTeamsStore.getState().hydrate(
      [
        { id: 1, name: 'A', slug: 'a', employee_count: 1, members: [] },
        { id: 2, name: 'B', slug: 'b', employee_count: 2, members: [] },
      ],
      2,
      'k',
    );
    useTeamsStore.getState().removeItem(1);
    expect(useTeamsStore.getState().items).toHaveLength(1);
    expect(useTeamsStore.getState().items[0].id).toBe(2);
  });
});
