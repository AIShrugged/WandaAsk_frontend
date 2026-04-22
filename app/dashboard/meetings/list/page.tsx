import { getMeetingsForDate, MeetingsColumnView } from '@/features/meetings';
import Card from '@/shared/ui/card/Card';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

function formatColumnDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Meetings list tab — shows meetings for yesterday, today, and tomorrow
 * relative to a selected center date. Navigates via ?date=YYYY-MM-DD.
 * Defaults to actual today when no param is provided.
 */
export default async function MeetingsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.date === 'string' ? params.date : '';
  const isValid =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    !Number.isNaN(new Date(raw + 'T00:00:00').getTime());

  const centerDate = isValid
    ? new Date(raw + 'T00:00:00')
    : new Date(new Date().toDateString()); // local midnight today

  const yesterdayDate = new Date(centerDate);

  yesterdayDate.setDate(centerDate.getDate() - 1);

  const tomorrowDate = new Date(centerDate);

  tomorrowDate.setDate(centerDate.getDate() + 1);

  const [yesterday, today, tomorrow] = await Promise.all([
    getMeetingsForDate(yesterdayDate),
    getMeetingsForDate(centerDate),
    getMeetingsForDate(tomorrowDate),
  ]);

  return (
    <Card className='h-full flex flex-col'>
      <MeetingsColumnView
        yesterday={yesterday}
        today={today}
        tomorrow={tomorrow}
        yesterdayDate={formatColumnDate(yesterdayDate)}
        todayDate={formatColumnDate(centerDate)}
        tomorrowDate={formatColumnDate(tomorrowDate)}
        centerDate={toDateParam(centerDate)}
      />
    </Card>
  );
}
