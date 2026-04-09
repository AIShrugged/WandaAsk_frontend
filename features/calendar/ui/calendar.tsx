import CalendarAgenda from '@/features/calendar/ui/calendar-agenda';
import Cells from '@/features/calendar/ui/cells';
import DayOfWeek from '@/features/calendar/ui/day-of-week';
import { MonthSwitcher } from '@/features/calendar/ui/month-switcher';
import ComponentHeader from '@/shared/ui/layout/component-header';

import type { EventProps } from '@/entities/event';
import type { ReactNode } from 'react';

/**
 * Calendar component — pure layout shell. Accepts renderEvent and onShowAll
 * as dependency-injection props so it stays free of cross-feature imports.
 * @param root0
 * @param root0.events
 * @param root0.currentMonth
 * @param root0.renderEvent
 * @param root0.onShowAll
 * @returns JSX element.
 */
export default function Calendar({
  events,
  currentMonth,
  renderEvent,
  onShowAll,
}: {
  events: EventProps[];
  currentMonth: string;
  renderEvent?: (event: EventProps) => ReactNode;
  onShowAll?: (events: EventProps[]) => void;
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
        <Cells
          events={events}
          currentMonth={currentMonth}
          renderEvent={renderEvent}
          onShowAll={onShowAll}
        />
      </div>
    </>
  );
}
