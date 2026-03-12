import { parse, format } from 'date-fns';

/**
 * Форматирует дату окончания события в вид "h:mma" (например, "1:30pm")
 * @param endsAt строка формата "yyyy-MM-dd HH:mm:ss"
 * @returns строка вида "1:30pm"
 */
export function formatDate(endsAt: string): string {
  const date = parse(endsAt, 'yyyy-MM-dd HH:mm:ss', new Date());

  return format(date, 'h:mma'); // например "1:30PM"
}
