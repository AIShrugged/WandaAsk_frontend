/**
 * Проверяет, прошло ли событие по локальному времени пользователя
 * @param endsAt строка формата "yyyy-MM-dd HH:mm:ss" (локальное время)
 */
export function isEventPast(endsAt: string): boolean {
  const localDate = new Date(endsAt.replace(' ', 'T'));

  return localDate.getTime() < Date.now();
}
