import { formatChatTime } from '@/features/transcript/lib/chatTime';

describe('formatChatTime', () => {
  it('formats seconds under one minute as MM:SS.ms', () => {
    expect(formatChatTime(5.5)).toBe('00:05.50');
  });

  it('formats exactly 0 seconds', () => {
    expect(formatChatTime(0)).toBe('00:00.00');
  });

  it('formats 1 minute exactly', () => {
    expect(formatChatTime(60)).toBe('01:00.00');
  });

  it('formats 90 seconds as 01:30.00', () => {
    expect(formatChatTime(90)).toBe('01:30.00');
  });

  it('formats 59 minutes 59 seconds', () => {
    expect(formatChatTime(3599)).toBe('59:59.00');
  });

  it('formats 1 hour as H:MM:SS.ms', () => {
    expect(formatChatTime(3600)).toBe('1:00:00.00');
  });

  it('formats 1 hour 30 min 15 sec', () => {
    expect(formatChatTime(5415)).toBe('1:30:15.00');
  });

  it('handles fractional milliseconds correctly', () => {
    const result = formatChatTime(10.123);

    // 10 seconds, 12 ms (slice to 2 digits from 3-digit padded)
    expect(result).toBe('00:10.12');
  });

  it('pads seconds with leading zero', () => {
    expect(formatChatTime(65)).toBe('01:05.00');
  });
});
