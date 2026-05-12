import { format, isToday } from 'date-fns';

/**
 * Day component.
 * @param props - Component props.
 * @param props.currentDay
 */
export default function Day({ currentDay }: { currentDay: Date }) {
  return (
    <div className='flex justify-center mb-1'>
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[length:var(--fs-sm)] font-medium
                  ${isToday(currentDay) ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'}`}
      >
        {format(currentDay, 'd')}
      </div>
    </div>
  );
}
