import type { EventProps } from '@/entities/event';
import type { CalendarEventListItem } from '@/features/meetings/model/types';

/**
 * Maps a CalendarEventListItem to the EventProps shape expected by calendar grid components.
 * @param item - org calendar event item.
 * @returns EventProps.
 */
export function toEventProps(item: CalendarEventListItem): EventProps {
  return {
    id: item.id,
    title: item.title,
    starts_at: item.starts_at,
    ends_at: item.ends_at,
    platform: item.platform,
    url: item.url ?? '',
    description: item.description ?? '',
    creator_user_id: 0,
    required_bot: item.required_bot,
    has_summary: item.has_summary,
  };
}

/**
 * Returns the Monday and Sunday of the current ISO week as YYYY-MM-DD strings.
 */
export function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;

  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);

  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day2 = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day2}`;
  };

  return { from: fmt(mon), to: fmt(sun) };
}
