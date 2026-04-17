'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { H2 } from '@/shared/ui/typography/H2';

interface DateSwitcherProps {
  selectedDate: string; // YYYY-MM-DD
}

const NAV_BUTTONS = [
  { id: 'prev', icon: ChevronLeft, offset: -1 },
  { id: 'next', icon: ChevronRight, offset: +1 },
] as const;

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const todayParam = toDateParam(today);
  const dateParam = toDateParam(date);

  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  if (dateParam === todayParam) return 'Today';
  if (dateParam === toDateParam(yesterday)) return 'Yesterday';
  if (dateParam === toDateParam(tomorrow)) return 'Tomorrow';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function DateSwitcher({ selectedDate }: DateSwitcherProps) {
  const { push } = useRouter();
  const params = useSearchParams();

  const current = new Date(selectedDate + 'T00:00:00');

  const setDate = (date: Date) => {
    const next = new URLSearchParams(params);

    next.set('date', toDateParam(date));
    push(`?${next.toString()}`);
  };

  const label = formatDateLabel(current);

  return (
    <div className='flex flex-row justify-between'>
      <div className='flex items-center gap-[11px]'>
        {NAV_BUTTONS.map(({ id, icon: Icon, offset }) => {
          const target = new Date(current);

          target.setDate(current.getDate() + offset);

          return (
            <button
              key={id}
              className='cursor-pointer'
              onClick={() => {
                return setDate(target);
              }}
            >
              <Icon />
            </button>
          );
        })}
        <H2>{label}</H2>
      </div>
    </div>
  );
}
