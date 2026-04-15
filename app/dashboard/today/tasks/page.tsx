import {
  AiNudge,
  AiPrepPanel,
  CarriedTasks,
  StaleItems,
  getTodayBriefing,
  WaitingOnYou,
} from '@/features/today-briefing';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function TodayTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const { date } = (await searchParams) ?? {};
  const data = await getTodayBriefing(date);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Tasks' />
      <CardBody>
        <div className='flex flex-col gap-6'>
          {data.events.map((event) => {
            return (
              <div key={event.id} className='flex flex-col gap-2'>
                <CarriedTasks count={data.carried_tasks.length} />
                <AiPrepPanel
                  event={event}
                  tasks={event.tasks}
                  carriedTasks={data.carried_tasks}
                />
              </div>
            );
          })}

          {data.events.length > 0 && (
            <AiNudge text={data.nudge} date={data.date} />
          )}

          <WaitingOnYou tasks={data.waiting_on_you} />
          <StaleItems tasks={data.stale} />
        </div>
      </CardBody>
    </Card>
  );
}
