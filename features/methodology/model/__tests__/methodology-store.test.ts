/* eslint-disable jsdoc/require-jsdoc */
import { useMethodologyStore } from '@/features/methodology/model/methodology-store';

import type { MethodologyProps } from '@/features/methodology/model/types';

const makeMethodology = (id: number): MethodologyProps => {
  return {
    id,
    name: `Methodology ${id}`,
    organization_id: String(id),
    text: `Text ${id}`,
    team_ids: [],
    teams: [],
  };
};

describe('useMethodologyStore', () => {
  beforeEach(() => {
    useMethodologyStore.getState().invalidate();
  });

  it('starts with empty items', () => {
    expect(useMethodologyStore.getState().items).toEqual([]);
  });

  it('starts with zero totalCount', () => {
    expect(useMethodologyStore.getState().totalCount).toBe(0);
  });

  it('is not loading initially', () => {
    expect(useMethodologyStore.getState().isLoading).toBe(false);
  });

  it('hydrate sets items, totalCount and cacheKey', () => {
    const items = [makeMethodology(1), makeMethodology(2)];

    useMethodologyStore.getState().hydrate(items, 2, 'org-1');
    const state = useMethodologyStore.getState();

    expect(state.items).toHaveLength(2);
    expect(state.totalCount).toBe(2);
    expect(state.cacheKey).toBe('org-1');
  });

  it('setLoading toggles isLoading', () => {
    useMethodologyStore.getState().setLoading(true);
    expect(useMethodologyStore.getState().isLoading).toBe(true);
    useMethodologyStore.getState().setLoading(false);
    expect(useMethodologyStore.getState().isLoading).toBe(false);
  });

  it('appendChunk extends items list', () => {
    useMethodologyStore.getState().hydrate([makeMethodology(1)], 3, 'k');
    useMethodologyStore
      .getState()
      .appendChunk([makeMethodology(2), makeMethodology(3)], false);
    expect(useMethodologyStore.getState().items).toHaveLength(3);
    expect(useMethodologyStore.getState().hasMore).toBe(false);
  });

  it('removeItem removes the matching id', () => {
    useMethodologyStore
      .getState()
      .hydrate([makeMethodology(1), makeMethodology(2)], 2, 'k');
    useMethodologyStore.getState().removeItem(1);
    expect(useMethodologyStore.getState().items).toHaveLength(1);
    expect(useMethodologyStore.getState().items[0].id).toBe(2);
  });

  it('invalidate resets state', () => {
    useMethodologyStore.getState().hydrate([makeMethodology(1)], 1, 'k');
    useMethodologyStore.getState().invalidate();
    expect(useMethodologyStore.getState().items).toEqual([]);
    expect(useMethodologyStore.getState().cacheKey).toBeNull();
  });
});
