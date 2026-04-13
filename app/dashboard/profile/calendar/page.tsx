import { getSources } from '@/features/calendar/api/source';
import { CalendarSection } from '@/features/user-profile';

export const metadata = { title: 'Calendar' };

/**
 * Calendar tab — displays the connected calendar status and disconnect action.
 */
export default async function ProfileCalendarPage() {
  const sources = await getSources();
  const calendarSource =
    sources.find((s) => {
      return s.is_connected === '1' || s.is_connected === true;
    }) ?? null;

  return <CalendarSection source={calendarSource} />;
}
