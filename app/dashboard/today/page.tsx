import { Suspense } from 'react';

import { getTodayBriefing, TodayPageContent } from '@/features/today-briefing';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';
import { Skeleton } from '@/shared/ui/layout/skeleton';

export const metadata = { title: 'Today' };

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const data = await getTodayBriefing(date);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Today' />
      <div className='h-full overflow-x-hidden overflow-y-scroll'>
        <CardBody>
          <Suspense
            fallback={
              <Skeleton className='h-48 rounded-[var(--radius-card)]' />
            }
          >
            <TodayPageContent data={data} />
          </Suspense>
        </CardBody>
      </div>
    </Card>
  );
}
