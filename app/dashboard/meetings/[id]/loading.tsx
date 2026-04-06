import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';

/**
 * Loading state for meeting detail page.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <CardBody>
        <div className='mx-auto flex w-full max-w-4xl flex-col gap-6'>
          <div className='h-4 w-40 rounded bg-muted/60' />
          <div className='h-20 rounded-[var(--radius-card)] border border-border bg-muted/30' />
          <div className='h-48 rounded-[var(--radius-card)] border border-border bg-muted/30' />
          <div className='h-48 rounded-[var(--radius-card)] border border-border bg-muted/30' />
          <div className='h-48 rounded-[var(--radius-card)] border border-border bg-muted/30' />
        </div>
      </CardBody>
    </Card>
  );
}
