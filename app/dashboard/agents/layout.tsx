import { AgentsTabsNav } from '@/features/agents/ui/agents-tabs-nav';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * AgentsLayout — shared layout for all agent sub-routes.
 * Renders the page card with header and route-based tab strip.
 */
export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Agents' />
      <div className='h-full overflow-y-auto'>
        <div className='flex flex-col gap-5 p-6 h-full'>
          <AgentsTabsNav />
          <div className='flex-1'>{children}</div>
        </div>
      </div>
    </Card>
  );
}
