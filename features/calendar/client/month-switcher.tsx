'use client';

import { addMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { H2 } from '@/shared/ui/typography/H2';

export const MonthSwitcher = ({ currentMonth }: { currentMonth: string }) => {
  const { push } = useRouter();
  const params = useSearchParams();

  const setMonth = (date: Date) => {
    const next = new URLSearchParams(params);
    next.set('month', format(date, 'yyyy-MM-01'));
    push(`?${next.toString()}`);
  };

  const buttons = [
    {
      icon: ChevronLeft,
      callback: -1,
    },
    {
      icon: ChevronRight,
      callback: +1,
    },
  ];

  return (
    <div className={'flex flex-row justify-between'}>
      <div className='flex items-center gap-[11px]'>
        {buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              className={'cursor-pointer'}
              key={index}
              onClick={() => setMonth(addMonths(currentMonth, button.callback))}
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
