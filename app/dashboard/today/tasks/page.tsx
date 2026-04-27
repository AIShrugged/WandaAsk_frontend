import {
  AiNudge,
  AiPrepPanel,
  ClosedTasksBlock,
  StaleItems,
  TaskStatsBlock,
  getTodayBriefing,
  WaitingOnYou,
} from '@/features/today-briefing';
import { FocusBlock } from '@/features/user-focus';
import { getUserFocus } from '@/features/user-focus/api/focus';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function TodayTasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const { date } = (await searchParams) ?? {};
  const [data, focus] = await Promise.all([
    getTodayBriefing(date),
    getUserFocus(),
  ]);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Tasks' />
      <div className='px-6 pt-4 flex flex-col gap-4'>
        <FocusBlock initialFocus={focus} readonly />
        <TaskStatsBlock />
        <ClosedTasksBlock />
      </div>
      <CardBody>
        <div className='flex flex-col gap-8'>
          {data.events.map((event) => {
            return (
              <div key={event.id} className='flex flex-col gap-8'>
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
