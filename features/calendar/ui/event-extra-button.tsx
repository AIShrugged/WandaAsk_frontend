'use client';

import type { EventProps } from '@/entities/event';

/**
 * EventExtraButton component.
 * @param root0
 * @param root0.count
 * @param root0.dayEvents
 * @param root0.onShowAll - Callback invoked when user clicks "+N more".
 * @returns JSX element.
 */
export default function EventExtraButton({
  count,
  dayEvents,
  onShowAll,
}: {
  count: number;
  dayEvents: EventProps[];
  onShowAll?: (events: EventProps[]) => void;
}) {
  /**
   * handleClick.
   * @param e - e.
   * @returns Result.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    onShowAll?.(dayEvents);
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
