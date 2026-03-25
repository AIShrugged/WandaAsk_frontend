import { format } from 'date-fns';

interface GreetingBlockProps {
  name: string | null;
}

/**
 * GreetingBlock — top-of-page welcome with current date.
 * @param root0
 * @param root0.name
 */
export function GreetingBlock({ name }: GreetingBlockProps) {
  const now = new Date();

  const hour = now.getHours();

  let greeting = 'Good evening';

  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

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
