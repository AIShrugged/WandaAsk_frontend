import {
  addDays,
  format,
  isToday,
  isYesterday,
  isTomorrow,
  parseISO,
} from 'date-fns';

/** YYYY-MM-DD string → Date (timezone-safe via date-fns parseISO) */
export function parseDateParam(dateStr: string): Date {
  return parseISO(dateStr);
}

/** Date → YYYY-MM-DD string for use as a query param */
export function toDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Shift a date by offset days and return YYYY-MM-DD string */
export function shiftDate(date: Date, offset: number): string {
  return toDateParam(addDays(date, offset));
}

/** Relative label: "Today" / "Yesterday" / "Tomorrow" / "Apr 22" */
export function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Long format: "Tuesday, April 22" */
export function formatDateLong(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}
