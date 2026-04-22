import { Video, Users, CheckSquare, ListChecks, FileText } from 'lucide-react';

import {
  KpiCard,
  SummaryHeader,
  getSummaryData,
  StatsSection,
} from '@/features/summary';

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

  if (!data) {
    return (
      <div className='flex flex-col gap-6 h-full overflow-y-auto p-2'>
        <SummaryHeader />
        <div className='flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-12 text-center'>
          <p className='text-base font-medium text-foreground'>
            Statistics unavailable
          </p>
          <p className='text-sm text-muted-foreground'>Try to reload page</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 h-full overflow-y-auto p-2'>
      {/* Header */}
      <SummaryHeader />

      {/* KPI row */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        <KpiCard
          label='Meetings'
          value={data.meetings.total}
          icon={<Video className='h-4 w-4' />}
          accent
        />
        <KpiCard
          label='Unique participants'
          value={data.participants.total_unique}
          icon={<Users className='h-4 w-4' />}
        />
        <KpiCard
          label='Tasks'
          value={data.tasks.total}
          icon={<CheckSquare className='h-4 w-4' />}
        />
        <KpiCard
          label='Follow-ups'
          value={data.followups.total}
          icon={<ListChecks className='h-4 w-4' />}
        />
        <KpiCard
          label='Summaries'
          value={data.summaries.total}
          icon={<FileText className='h-4 w-4' />}
        />
      </div>

      <StatsSection data={data} />
    </div>
  );
}
