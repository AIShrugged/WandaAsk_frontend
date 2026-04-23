'use client';

import { DateNavigator } from '@/shared/ui/navigation/date-navigator';

interface DateSwitcherProps {
  selectedDate: string; // YYYY-MM-DD
}

export function DateSwitcher({ selectedDate }: DateSwitcherProps) {
  return (
    <DateNavigator date={selectedDate} variant='prominent' preserveParams />
  );
}
