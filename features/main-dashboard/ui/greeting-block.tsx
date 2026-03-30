'use client';

import { format } from 'date-fns';

interface GreetingBlockProps {
  name: string | null;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * GreetingBlock — top-of-page welcome with current local date/time.
 * Rendered client-side so `new Date()` reflects the user's local timezone.
 * @param root0
 * @param root0.name
 */
export function GreetingBlock({ name }: GreetingBlockProps) {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = format(now, 'EEEE, MMMM d, yyyy');

  return (
    <div className='flex flex-col gap-1'>
      <h1 className='text-2xl font-bold text-foreground'>
        {name ? `${greeting}, ${name.split(' ')[0]}` : greeting}
      </h1>
      <p className='text-sm text-muted-foreground'>{dateLabel}</p>
    </div>
  );
}
