import React from 'react';

import { getWeekdayAndDay } from '@/features/event/lib/get-weekday-and-day';
import ButtonClose from '@/shared/ui/button/button-close';
import { H4 } from '@/shared/ui/typography/H4';

import type { EventProps } from '@/features/event/model/types';

export const EventPopupAll = ({
  list,
  close,
}: {
  list: EventProps[];
  close: () => void;
}) => {
  const { weekday, day } = getWeekdayAndDay(list[0].starts_at);

  return (
    <div className='bg-white rounded-3xl shadow-2xl border border-gray-200'>
      <div className='flex flex-row justify-between items-center px-[38px] pt-[26px] pb-[18px] border-b-border-primary'>
        <div>
          <H4>{day}</H4>
          {weekday}
        </div>
        <ButtonClose close={close} />
      </div>

      <div className={'p-5 flex flex-col gap-1'}>
        {list.map(event => (
          <div key={event.id}></div>
        ))}
      </div>
    </div>
  );
};
