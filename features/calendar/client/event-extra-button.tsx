import React from 'react';

import { EventPopupAll } from '@/features/event/ui/event-popup-all';
import { useModal } from '@/shared/hooks/use-modal';

import type { EventProps } from '@/features/event/model/types';

export default function EventExtraButton({
  count,
  dayEvents,
}: {
  count: number;
  dayEvents: EventProps[];
}) {
  const { open, close } = useModal();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (open) {
      return open(<EventPopupAll list={dayEvents} close={close} />);
    }
  };

  return (
    <div
      onClick={e => {
        handleClick(e);
        e.stopPropagation();
      }}
      className='cursor-pointer text-xs text-gray-500 text-center'
    >
      +{count} more
    </div>
  );
}
