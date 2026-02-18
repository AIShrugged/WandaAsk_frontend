import Cells from '@/features/calendar/ui/cells';
import DayOfWeek from '@/features/calendar/ui/day-of-week';
import { MonthSwitcher } from '@/features/calendar/ui/month-switcher';
import ComponentHeader from '@/shared/ui/layout/component-header';

import type { EventProps } from '@/entities/event';

export default function Calendar({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) {
  return (
    <>
      <ComponentHeader>
        <MonthSwitcher currentMonth={currentMonth} />
      </ComponentHeader>

      <DayOfWeek />

      <div className='flex-1 flex flex-col'>
        <Cells events={events} currentMonth={currentMonth} />
      </div>
    </>
  );
}
