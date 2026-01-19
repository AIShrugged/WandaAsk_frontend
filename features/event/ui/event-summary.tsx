import { Fragment } from 'react';

import { items } from '@/features/event/lib/options';

import type { EventProps } from '@/features/event/model/types';

export default function EventSummary({ event }: { event: EventProps }) {
  const iconClass = 'w-6 h-6 shrink-0';
  const textClass = 'font-normal text-[20px]';

  return (
    <Fragment>
      {items.map(({ Icon, value, label }) => (
        <div key={label} className='flex items-center gap-4'>
          <Icon className={iconClass} />
          <p className={textClass}>{value(event)}</p>
        </div>
      ))}
    </Fragment>
  );
}
