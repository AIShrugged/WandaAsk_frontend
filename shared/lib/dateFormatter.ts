import { parse, format, isValid } from 'date-fns';

/**
 * Parses a date string that may be either "yyyy-MM-dd HH:mm:ss" or ISO 8601.
 */
function parseEventDate(dateString: string): Date {
  const parsed = parse(dateString, 'yyyy-MM-dd HH:mm:ss', new Date());

  if (isValid(parsed)) return parsed;

  const fallback = new Date(dateString);

  if (isValid(fallback)) return fallback;

  throw new RangeError(`Invalid date string: ${dateString}`);
}

/**
 * Formats an event date string to "h:mma" (e.g. "1:30pm").
 * Accepts "yyyy-MM-dd HH:mm:ss" or ISO 8601 strings.
 */
export function formatDate(endsAt: string): string {
  return format(parseEventDate(endsAt), 'h:mma');
}

export { parseEventDate };
