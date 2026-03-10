import { formatDate } from '@/shared/lib/dateFormatter';

describe('formatDate', () => {
  it('formats time as h:mma for AM time', () => {
    expect(formatDate('2024-03-15 09:05:00')).toBe('9:05AM');
  });

  it('formats time as h:mma for PM time', () => {
    expect(formatDate('2024-03-15 14:30:00')).toBe('2:30PM');
  });

  it('formats midnight as 12:00AM', () => {
    expect(formatDate('2024-03-15 00:00:00')).toBe('12:00AM');
  });

  it('formats noon as 12:00PM', () => {
    expect(formatDate('2024-03-15 12:00:00')).toBe('12:00PM');
  });

  it('formats 1pm as 1:00PM', () => {
    expect(formatDate('2024-06-01 13:00:00')).toBe('1:00PM');
  });

  it('formats minutes correctly', () => {
    expect(formatDate('2024-01-01 08:45:00')).toBe('8:45AM');
  });
});
