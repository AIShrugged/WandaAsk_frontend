import { CheckCircle2 } from 'lucide-react';

import {
  getCalendarEventDetail,
  getMeetingTasks,
} from '@/features/event/api/calendar-events';
import MeetingTasks from '@/features/meeting/ui/meeting-tasks';

/**
 * Meeting tasks tab — shows AI-extracted meeting tasks.
 */
export default async function MeetingTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch from detail first (has tasks embedded), fall back to the tasks endpoint
  const [{ data }, fallbackTasks] = await Promise.all([
    getCalendarEventDetail(id),
    getMeetingTasks(id),
  ]);

  const tasks =
    Array.isArray(data.tasks) && data.tasks.length > 0
      ? data.tasks
      : fallbackTasks;

  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <section className='rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 shadow-card'>
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          <CheckCircle2 className='h-3.5 w-3.5' />
          Tasks ({tasks.length})
        </div>
        <div className='mt-4'>
          <MeetingTasks tasks={tasks} />
        </div>
      </section>
    </div>
  );
}
