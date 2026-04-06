'use client';

import { addDays, format, isToday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

interface DayNavigatorProps {
  date: string;
}

export function DayNavigator({ date }: DayNavigatorProps) {
  const router = useRouter();
  const current = parseISO(date);
  const isTodayDate = isToday(current);

  function navigate(offset: number) {
    const newDate = addDays(current, offset);
    const dateStr = format(newDate, 'yyyy-MM-dd');
    router.push(`${ROUTES.DASHBOARD.TODAY}?date=${dateStr}`, {
      scroll: false,
    });
  }

  function goToday() {
    router.push(ROUTES.DASHBOARD.TODAY, { scroll: false });
  }

  return (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={() => navigate(-1)}
        className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>

      <span className='text-sm font-medium text-foreground min-w-[160px] text-center'>
        {format(current, 'EEEE, d MMMM', { locale: ru })}
      </span>

      <button
        type='button'
        onClick={() => navigate(1)}
        className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-muted transition-colors'
      >
        <ChevronRight className='h-4 w-4' />
      </button>

      {!isTodayDate && (
        <button
          type='button'
          onClick={goToday}
          className='ml-1 rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors'
        >
          Today
        </button>
      )}
    </div>
  );
}
