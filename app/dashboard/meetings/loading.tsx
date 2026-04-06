import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Loading state for Meetings page.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <PageHeader title='Meetings' />
      <CardBody>
        <div className='flex flex-col gap-4'>
          <div className='h-4 w-24 rounded bg-muted/60' />
          <div className='h-36 rounded-[var(--radius-card)] border border-border bg-muted/30' />
          <div className='h-36 rounded-[var(--radius-card)] border border-border bg-muted/30' />
          <div className='h-36 rounded-[var(--radius-card)] border border-border bg-muted/30' />
        </div>
      </CardBody>
    </Card>
  );
}
