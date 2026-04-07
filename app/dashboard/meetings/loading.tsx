import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

const TABS = [
  { id: 'meetings', label: 'Meetings' },
  { id: 'calendar', label: 'Calendar' },
] as const;

/**
 * Loading state for Meetings page.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <div className='flex gap-1 border-b border-border'>
        {TABS.map((tab) => {
          return (
            <div
              key={tab.id}
              className='px-4 py-2 text-sm font-medium text-muted-foreground'
            >
              {tab.label}
            </div>
          );
        })}
      </div>
      <div className='flex flex-1 items-center justify-center'>
        <div className='flex flex-col items-center gap-4 px-8 py-6'>
          <SpinLoader />
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    </Card>
  );
}
