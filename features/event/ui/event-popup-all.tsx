import React from 'react';

import { getWeekdayAndDay } from '@/features/event/lib/get-weekday-and-day';
import ButtonClose from '@/shared/ui/button/button-close';
import { H4 } from '@/shared/ui/typography/H4';

import type { EventProps } from '@/entities/event';

/**
 * EventPopupAll component.
 * @param root0
 * @param root0.list
 * @param root0.close
 */
export const EventPopupAll = ({
  list,
  close,
}: {
  list: EventProps[];
  close: () => void;
}) => {
  const { weekday, day } = getWeekdayAndDay(list[0].starts_at);

  return (
    <div className='bg-card rounded-[var(--radius-card)] shadow-card border border-border'>
      <div className='flex flex-row justify-between items-center px-6 pt-5 pb-4 border-b border-border'>
        <div>
          <H4>{day}</H4>
          <span className='text-sm text-muted-foreground'>{weekday}</span>
        </div>
        <ButtonClose close={close} />
      </div>

      <div className='p-4 flex flex-col gap-1'>
        {list.map((event) => {
          return <div key={event.id} />;
        })}
      </div>
    </div>
  );
};
