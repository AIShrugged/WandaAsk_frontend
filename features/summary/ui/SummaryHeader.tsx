import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';

/**
 * SummaryHeader component.
 * Displays the page title, subtitle, and current date for the summary report.
 * @returns JSX element.
 */
export function SummaryHeader() {
  const today = format(new Date(), 'MMMM d, yyyy');

  return (
    <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <BarChart3 className='h-5 w-5' />
        </div>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Summary Report</h1>
          <p className='text-sm text-muted-foreground'>
            Analytics for meetings, tasks and participants
          </p>
        </div>
      </div>
      <span className='text-sm font-medium text-muted-foreground capitalize'>
        {today}
      </span>
    </div>
  );
}
