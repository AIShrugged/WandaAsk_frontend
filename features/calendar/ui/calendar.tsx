import CalendarAgenda from '@/features/calendar/ui/calendar-agenda';
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

      {/* Mobile: agenda list view */}
      <div className='md:hidden overflow-y-auto'>
        <CalendarAgenda events={events} currentMonth={currentMonth} />
      </div>

      {/* Desktop: full month grid */}
      <div className='hidden md:block'>
        <DayOfWeek />
      </div>

      <div className='hidden md:flex flex-1 flex-col'>
        <Cells events={events} currentMonth={currentMonth} />
      </div>
    </>
  );
}
