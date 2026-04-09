import { filters } from '@/features/transcript/lib/options';

describe('transcript options', () => {
  it('has a limit of 10', () => {
    expect(filters.limit).toBe(10);
  });
});
