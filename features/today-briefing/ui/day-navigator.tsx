'use client';

import { DateNavigator } from '@/shared/ui/navigation/date-navigator';

interface DayNavigatorProps {
  date: string;
  meetingsCount: number;
}

export function DayNavigator({ date, meetingsCount }: DayNavigatorProps) {
  const badge =
    meetingsCount > 0 ? (
      <span className='text-xs text-muted-foreground'>
        {meetingsCount} {meetingsCount === 1 ? 'meeting' : 'meetings'}
      </span>
    ) : null;

  return (
    <DateNavigator
      date={date}
      variant='prominent'
      showBackToday
      badge={badge}
    />
  );
}
