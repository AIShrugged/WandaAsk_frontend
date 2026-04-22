import { MeetingsTabsNav } from '@/features/meetings';
import Card from '@/shared/ui/card/Card';

/**
 * MeetingsLayout — shared layout for all meetings sub-routes.
 * Renders the card with route-based tab strip.
 */
export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <MeetingsTabsNav />
      <div className='flex-1 min-h-0 overflow-y-auto'>{children}</div>
    </Card>
  );
}
