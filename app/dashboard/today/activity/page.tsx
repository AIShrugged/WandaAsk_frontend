import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export const dynamic = 'force-dynamic';

export default function TodayActivityPage() {
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Activity' />
      <CardBody>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Activity tab - Coming soon</p>
        </div>
      </CardBody>
    </Card>
  );
}
