import { getDefaultDateRange } from '@/features/meetings/model/utils';

describe('getDefaultDateRange', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function setLocalNoon(year: number, month: number, day: number) {
    // month is 0-indexed (JS convention)
    jest.useFakeTimers();
    jest.setSystemTime(new Date(year, month, day, 12, 0, 0));
  }

  it('returns Monday as from and Sunday as to for a Wednesday', () => {
    setLocalNoon(2026, 3, 8); // April 8 2026, Wednesday
    const { from, to } = getDefaultDateRange();
    expect(from).toBe('2026-04-06'); // Monday
    expect(to).toBe('2026-04-12'); // Sunday
  });

  it('returns the same week Monday–Sunday when called on a Monday', () => {
    setLocalNoon(2026, 3, 6); // April 6 2026, Monday
    const { from, to } = getDefaultDateRange();
    expect(from).toBe('2026-04-06');
    expect(to).toBe('2026-04-12');
  });

  it('returns the current week Monday–Sunday when called on a Sunday', () => {
    setLocalNoon(2026, 3, 12); // April 12 2026, Sunday
    const { from, to } = getDefaultDateRange();
    expect(from).toBe('2026-04-06');
    expect(to).toBe('2026-04-12');
  });

  it('returns YYYY-MM-DD formatted strings', () => {
    setLocalNoon(2026, 3, 9); // April 9 2026, Thursday
    const { from, to } = getDefaultDateRange();
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('to date is always 6 days after from date', () => {
    setLocalNoon(2026, 3, 9); // April 9 2026, Thursday
    const { from, to } = getDefaultDateRange();
    const diff =
      (new Date(to).getTime() - new Date(from).getTime()) /
      (1000 * 60 * 60 * 24);
    expect(diff).toBe(6);
  });
});
