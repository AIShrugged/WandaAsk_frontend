'use client';

import { DateNavigator } from '@/shared/ui/navigation/date-navigator';

export function DateSwitcher({ selectedDate }: { selectedDate: string }) {
  return (
    <DateNavigator date={selectedDate} variant='prominent' preserveParams />
  );
}
