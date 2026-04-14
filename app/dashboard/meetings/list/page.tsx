import { getMeetingsForThreeDays } from '@/features/meetings/api/meetings';
import { MeetingsColumnView } from '@/features/meetings/ui/meetings-column-view';

function formatColumnDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Meetings list tab — shows bot meetings for yesterday, today, and tomorrow.
 */
export default async function MeetingsListPage() {
  const { yesterday, today, tomorrow } = await getMeetingsForThreeDays();

  const now = new Date();
  const yesterdayDate = new Date(now);

  yesterdayDate.setDate(now.getDate() - 1);

  const tomorrowDate = new Date(now);

  tomorrowDate.setDate(now.getDate() + 1);

  return (
    <MeetingsColumnView
      yesterday={yesterday}
      today={today}
      tomorrow={tomorrow}
      yesterdayDate={formatColumnDate(yesterdayDate)}
      todayDate={formatColumnDate(now)}
      tomorrowDate={formatColumnDate(tomorrowDate)}
    />
  );
}
