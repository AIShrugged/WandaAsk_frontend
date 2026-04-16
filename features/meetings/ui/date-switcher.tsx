'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { ButtonIcon } from '@/shared/ui/button/button-icon';

interface DateSwitcherProps {
  selectedDate: string; // YYYY-MM-DD
}

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
  const current = new Date(selectedDate + 'T00:00:00');

  const prev = new Date(current);

  prev.setDate(current.getDate() - 1);

  const next = new Date(current);

  next.setDate(current.getDate() + 1);

  const label = formatDateLabel(current);
  const prevParam = toDateParam(prev);
  const nextParam = toDateParam(next);

  return (
    <div className='flex items-center justify-between gap-4'>
      <ButtonIcon
        icon={<ChevronLeft className='h-5 w-5' />}
        href={`?date=${prevParam}`}
      />
      <span className='text-sm font-semibold text-foreground'>{label}</span>
      <ButtonIcon
        icon={<ChevronRight className='h-5 w-5' />}
        href={`?date=${nextParam}`}
      />
    </div>
  );
}
