'use client';

import { addMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { H2 } from '@/shared/ui/typography/H2';

export const MonthSwitcher = ({ currentMonth }: { currentMonth: string }) => {
  const { push } = useRouter();
  const params = useSearchParams();

  const setMonth = (date: Date) => {
    const next = new URLSearchParams(params);

    next.set('month', format(date, 'yyyy-MM-01'));
    push(`?${next.toString()}`);
  };

  const current = new Date(currentMonth);

  return (
    <div className='flex items-center gap-[11px]'>
      <button
        type='button'
        aria-label='Previous month'
        className='cursor-pointer'
        onClick={() => {
          setMonth(addMonths(current, -1));
        }}
      >
        <ChevronLeft />
      </button>

      <H2>{format(current, 'MMMM, yyyy')}</H2>

      <button
        type='button'
        aria-label='Next month'
        className='cursor-pointer'
        onClick={() => {
          setMonth(addMonths(current, 1));
        }}
      >
        <ChevronRight />
      </button>
    </div>
  );
};
