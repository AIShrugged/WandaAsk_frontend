'use client';

import { clsx } from 'clsx';
import { format, isToday } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface Props {
  currentDay: Date;
  isSelected: boolean;
  dateKey: string;
}

export function DayButton({ currentDay, isSelected, dateKey }: Props) {
  const today = isToday(currentDay);
  const { push } = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const handleClick = () => {
    const next = new URLSearchParams(params);

    if (isSelected) {
      next.delete('day');
    } else {
      next.set('day', dateKey);
    }

    startTransition(() => {
      push(`?${next.toString()}`, { scroll: false });
    });
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full text-[length:var(--fs-sm)] font-medium transition-colors',
        today && 'bg-primary text-primary-foreground',
        isSelected &&
          today &&
          'ring-2 ring-offset-1 ring-primary-foreground/60',
        isSelected &&
          !today &&
          'ring-2 ring-primary/60 text-primary font-semibold',
        !today &&
          !isSelected &&
          'hover:bg-muted hover:text-foreground cursor-pointer',
      )}
      aria-label={format(currentDay, 'MMMM d, yyyy')}
      aria-pressed={isSelected}
    >
      {format(currentDay, 'd')}
    </button>
  );
}
