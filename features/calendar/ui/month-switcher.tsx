'use client';

import { addMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { H2 } from '@/shared/ui/typography/H2';

// Defined outside component — no recreation on every render
const NAV_BUTTONS = [
  { id: 'prev', icon: ChevronLeft, offset: -1 },
  { id: 'next', icon: ChevronRight, offset: +1 },
] as const;

/**
 * MonthSwitcher component.
 * @param props - Component props.
 * @param props.currentMonth
 */
export const MonthSwitcher = ({ currentMonth }: { currentMonth: string }) => {
  const { push } = useRouter();
  const params = useSearchParams();
  /**
   * setMonth.
   * @param date - date.
   * @returns Result.
   */
  const setMonth = (date: Date) => {
    const next = new URLSearchParams(params);

    next.set('month', format(date, 'yyyy-MM-01'));
    push(`?${next.toString()}`);
  };

  return (
    <div className='flex flex-row justify-between'>
      <div className='flex items-center gap-[11px]'>
        {NAV_BUTTONS.map(({ id, icon: Icon, offset }) => {
          return (
            <button
              key={id}
              className='cursor-pointer'
              onClick={() => {
                return setMonth(addMonths(currentMonth, offset));
              }}
            >
              <Icon />
            </button>
          );
        })}
        <H2>{format(currentMonth, 'MMMM, yyyy')}</H2>
      </div>
    </div>
  );
};
