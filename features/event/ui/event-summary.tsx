import { Fragment } from 'react';

import { items } from '@/features/event/lib/options';

import type { EventProps } from '@/entities/event';

/**
 * EventSummary component.
 * @param props - Component props.
 * @param props.event
 * @returns JSX element.
 */
export default function EventSummary({ event }: { event: EventProps }) {
  const iconClass = 'w-6 h-6 shrink-0';
  const textClass = 'font-normal text-base md:text-[20px] min-w-0 truncate';

  return (
    <Fragment>
      {items.map(({ Icon, value, label }) => {
        return (
          <div key={label} className='flex items-center gap-4 min-w-0'>
            <Icon className={iconClass} />
            <div className={textClass}>{value(event)}</div>
          </div>
        );
      })}
    </Fragment>
  );
}
