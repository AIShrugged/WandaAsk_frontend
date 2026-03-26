import { isEventPast } from '@/shared/lib/isEventPast';

/**
 *
 * @param n
 */
const pad = (n: number) => {
  return String(n).padStart(2, '0');
};

describe('isEventPast', () => {
  it('returns true for a date in the distant past', () => {
    expect(isEventPast('2000-01-01 10:00:00')).toBe(true);
  });

  it('returns false for a date far in the future', () => {
    expect(isEventPast('2099-12-31 23:59:59')).toBe(false);
  });

  it('returns true for yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const formatted = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())} 00:00:00`;

    expect(isEventPast(formatted)).toBe(true);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())} 23:59:59`;

    expect(isEventPast(formatted)).toBe(false);
  });
});
