import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  Lightbulb,
  ListTodo,
  Loader2,
  Target,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type {
  LatestMeetingTask,
  LatestMeetingTasksData,
  UpcomingAgenda,
  UpcomingAgendaRaw,
  UpcomingAgendaStatus,
} from '@/features/main-dashboard/model/upcoming-agenda-types';

interface TaskStatusIconProps {
  status: LatestMeetingTask['status'];
}

function TaskStatusIcon({ status }: TaskStatusIconProps) {
  if (status === 'done') {
    return <CheckCircle2 className='h-3.5 w-3.5 shrink-0 text-green-500' />;
  }

  if (status === 'cancelled') {
    return <XCircle className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />;
  }

  if (status === 'in_progress') {
    return (
      <Loader2 className='h-3.5 w-3.5 shrink-0 text-primary animate-spin' />
    );
  }

  return <Circle className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />;
}

function TaskList({ tasks }: { tasks: LatestMeetingTask[] }) {
  return (
    <ul className='flex flex-col gap-1.5'>
      {tasks.map((task) => {
        return (
          <li key={task.id}>
            <Link
              href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
              className='flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group'
            >
              <TaskStatusIcon status={task.status} />
              <div className='flex flex-col gap-0.5 min-w-0'>
                <span
                  className={`text-xs font-medium leading-tight group-hover:text-primary transition-colors ${
                    task.status === 'done' || task.status === 'cancelled'
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {task.name}
                </span>
                {(task.assignee_name || task.due_date) && (
                  <span className='text-[10px] text-muted-foreground/70 truncate'>
                    {task.assignee_name && <span>{task.assignee_name}</span>}
                    {task.assignee_name && task.due_date && <span> · </span>}
                    {task.due_date && (
                      <span>{format(new Date(task.due_date), 'd MMM')}</span>
                    )}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

interface TasksColumnProps {
  data: LatestMeetingTasksData;
}

function TasksColumn({ data }: TasksColumnProps) {
  const formattedDate = data.meeting_date
    ? format(new Date(data.meeting_date), 'd MMM yyyy')
    : null;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <ListTodo className='h-4 w-4 text-primary' />
        <h3 className='text-sm font-semibold text-foreground'>
          Tasks from last meeting
        </h3>
      </div>

      {data.meeting_title ? (
        <p className='text-xs text-muted-foreground'>
          {data.meeting_title}
          {formattedDate && (
            <span className='ml-1 text-muted-foreground/60'>
              · {formattedDate}
            </span>
          )}
        </p>
      ) : null}

      {data.tasks.length === 0 && data.other_tasks.length === 0 ? (
        <p className='text-xs text-muted-foreground/70 italic'>
          No tasks found in recent meetings
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {data.tasks.length > 0 && <TaskList tasks={data.tasks} />}
          {data.other_tasks.length > 0 && (
            <div className='flex flex-col gap-1.5'>
              <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                Other open tasks
              </span>
              <TaskList tasks={data.other_tasks} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AgendaColumnProps {
  agenda: UpcomingAgenda;
}

function AgendaSection({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-1.5'>
        {icon}
        <span className='text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
          {label}
        </span>
      </div>
      <ul className='flex flex-col gap-0.5 pl-0.5'>
        {items.map((item, i) => {
          return (
            <li key={i} className='text-xs text-foreground/80 leading-relaxed'>
              <span className='text-muted-foreground mr-1'>·</span>
              {item}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AgendaContent({
  status,
  raw,
}: {
  status: UpcomingAgendaStatus;
  raw: UpcomingAgendaRaw | null;
}) {
  if (status === 'pending' || status === 'in_progress') {
    return (
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
        Generating…
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className='flex items-center gap-2 text-xs text-destructive'>
        <AlertCircle className='h-3.5 w-3.5' />
        Generation failed
      </div>
    );
  }

  if (raw) {
    return (
      <div className='flex flex-col gap-3'>
        {raw.next_meeting_context && (
          <p className='text-xs text-foreground/80 leading-relaxed'>
            {raw.next_meeting_context}
          </p>
        )}
        <AgendaSection
          icon={<CheckCircle2 className='h-3 w-3 text-green-500' />}
          label='Follow-up'
          items={raw.follow_up_items ?? []}
        />
        <AgendaSection
          icon={<HelpCircle className='h-3 w-3 text-amber-500' />}
          label='Open questions'
          items={raw.open_questions ?? []}
        />
        <AgendaSection
          icon={<Target className='h-3 w-3 text-primary' />}
          label='Focus areas'
          items={raw.focus_areas ?? []}
        />
      </div>
    );
  }

  return (
    <p className='text-xs text-muted-foreground/70 italic'>No content yet</p>
  );
}

function AgendaColumn({ agenda }: AgendaColumnProps) {
  const formattedDate = format(
    new Date(agenda.source_meeting_date),
    'd MMM yyyy, HH:mm',
  );

  const raw: UpcomingAgendaRaw | null = agenda.raw_json;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-0.5'>
        <p className='text-xs text-muted-foreground'>
          After:{' '}
          <span className='text-foreground/80'>
            {agenda.source_meeting_title}
          </span>
          <span className='ml-1 text-muted-foreground/60'>
            · {formattedDate}
          </span>
        </p>
        {agenda.source_meeting_participants.length > 0 && (
          <p className='text-xs text-muted-foreground/70'>
            {agenda.source_meeting_participants.join(', ')}
          </p>
        )}
      </div>

      <AgendaContent status={agenda.status} raw={raw} />
    </div>
  );
}

interface NextMeetingPrepBlockProps {
  agenda: UpcomingAgenda | null;
  latestTasks: LatestMeetingTasksData;
}

export function NextMeetingPrepBlock({
  agenda,
  latestTasks,
}: NextMeetingPrepBlockProps) {
  const hasContent = agenda !== null || latestTasks.tasks.length > 0;

  return (
    <Card className='flex flex-col gap-0'>
      {/* Header */}
      <div className='flex items-center gap-2 px-5 py-4 border-b border-border'>
        <Lightbulb className='h-4 w-4 text-primary' />
        <h2 className='text-base font-semibold text-foreground'>
          Upcoming Agendas
        </h2>
      </div>

      {hasContent ? (
        <div className='grid grid-cols-1 gap-6 p-5 lg:grid-cols-2 lg:divide-x lg:divide-border'>
          {/* Left: Agenda */}
          <div className='lg:pr-6'>
            {agenda ? (
              <AgendaColumn agenda={agenda} />
            ) : (
              <p className='text-xs text-muted-foreground/70 italic'>
                Generated after your next recorded meeting
              </p>
            )}
          </div>

          {/* Right: Tasks */}
          <div className='lg:pl-6'>
            <TasksColumn data={latestTasks} />
          </div>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center gap-2 px-5 py-10 text-center'>
          <Clock className='h-8 w-8 text-muted-foreground/40' />
          <p className='text-sm font-medium text-muted-foreground'>
            No data yet
          </p>
          <p className='text-xs text-muted-foreground/70'>
            Appears after your first meeting is recorded
          </p>
        </div>
      )}
    </Card>
  );
}
