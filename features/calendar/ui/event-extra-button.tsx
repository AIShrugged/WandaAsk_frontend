'use client';

import { EventPopupAll } from '@/features/event/ui/event-popup-all';
import { useModal } from '@/shared/hooks/use-modal';

import type { EventProps } from '@/entities/event';

/**
 * EventExtraButton component.
 * @param root0
 * @param root0.count
 * @param root0.dayEvents
 */
export default function EventExtraButton({
  count,
  dayEvents,
}: {
  count: number;
  dayEvents: EventProps[];
}) {
  const { open, close } = useModal();

  /**
   * handleClick.
   * @param e - e.
   * @returns Result.
   */
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
