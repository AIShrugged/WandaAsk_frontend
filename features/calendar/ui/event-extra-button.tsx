'use client';

import { EventPopupAll } from '@/features/event/ui/event-popup-all';
import { useModal } from '@/shared/hooks/use-modal';

import type { EventProps } from '@/entities/event';

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
    if (open) open(<EventPopupAll list={dayEvents} close={close} />);
  };

  return (
    <div
      onClick={handleClick}
      className='cursor-pointer text-xs text-gray-500 text-center'
    >
      +{count} more
    </div>
  );
}
