import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Meetings page - mock placeholder.
 */
export default function MeetingsPage() {
  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Meetings' />
      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          <div className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
            <p className='text-lg font-medium'>Meetings</p>
            <p className='text-sm'>Coming soon...</p>
          </div>
        </CardBody>
      </div>
    </Card>
  );
}
