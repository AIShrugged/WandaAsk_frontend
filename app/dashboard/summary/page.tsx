import { Video, Users, CheckSquare, ListChecks, FileText } from 'lucide-react';

import { getSummaryData } from '@/features/summary/api/summary';
import { FollowupStats } from '@/features/summary/ui/FollowupStats';
import { MeetingStats } from '@/features/summary/ui/MeetingStats';
import { ParticipantStats } from '@/features/summary/ui/ParticipantStats';
import { SummaryHeader } from '@/features/summary/ui/SummaryHeader';
import { TaskStats } from '@/features/summary/ui/TaskStats';
import { TeamStats } from '@/features/summary/ui/TeamStats';

// ------------------------------
// KPI card — Server Component (no client bundle cost)
// ------------------------------
interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}

/**
 * KpiCard component. @param props - Component props. @param props.label @param props.value @param props.icon @param props.accent
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.icon
 * @param root0.accent
 * @returns JSX element.
 */
function KpiCard({ label, value, icon, accent = false }: KpiCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>
          {label}
        </span>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary'>
          {icon}
        </div>
      </div>
      <p
        className={
          accent
            ? 'text-3xl font-bold text-primary tabular-nums'
            : 'text-3xl font-bold text-foreground tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}

// ------------------------------
// Page (SSR — Server Component)
// ------------------------------
/**
 * SummaryPage component.
 * Full-page summary report fetched server-side and rendered via a grid
 * of stat sections and recharts client wrappers.
 * @returns JSX element.
 */
export default async function SummaryPage() {
  const data = await getSummaryData();

  return (
    <div className='flex flex-col gap-6 h-full overflow-y-auto p-2'>
      {/* Header */}
      <SummaryHeader />

      {/* KPI row */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        <KpiCard
          label='Встречи'
          value={data.meetings.total}
          icon={<Video className='h-4 w-4' />}
          accent
        />
        <KpiCard
          label='Уникальных участников'
          value={data.participants.total_unique}
          icon={<Users className='h-4 w-4' />}
        />
        <KpiCard
          label='Задачи'
          value={data.tasks.total}
          icon={<CheckSquare className='h-4 w-4' />}
        />
        <KpiCard
          label='Follow-up'
          value={data.followups.total}
          icon={<ListChecks className='h-4 w-4' />}
        />
        <KpiCard
          label='Конспектов'
          value={data.summaries.total}
          icon={<FileText className='h-4 w-4' />}
        />
      </div>

      {/* Meetings */}
      <MeetingStats data={data.meetings} />

      {/* Tasks & Follow-ups — side by side on large screens */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <TaskStats data={data.tasks} />
        <FollowupStats data={data.followups} />
      </div>

      {/* Participants */}
      <ParticipantStats data={data.participants} />

      {/* Teams */}
      <TeamStats data={data.teams} />
    </div>
  );
}
