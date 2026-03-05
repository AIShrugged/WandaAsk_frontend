import { WEEK_DAYS } from '@/features/calendar/lib/options';

/**
 * DayOfWeek component.
 */
export default function DayOfWeek() {
  return (
    <div className='grid grid-cols-7 text-center text-xs font-medium text-muted-foreground'>
      {WEEK_DAYS.map((day) => {
        return (
          <div key={day} className='py-3'>
            {day}
          </div>
        );
      })}
    </div>
  );
}
