import { CheckSquare, FileText, ListChecks, Users, Video } from 'lucide-react';

import { KpiCard, SummaryHeader } from '@/features/summary';
import { getSummaryData } from '@/features/summary/api/summary';
import { StatsSection } from '@/features/summary/ui/stats-section';

export const metadata = { title: 'Statistics' };

/**
 * Statistics tab page.
 */
export default async function MainStatisticsPage() {
  const summaryData = await getSummaryData();

  if (!summaryData) {
    return (
      <div className='flex flex-col gap-6 p-2'>
        <SummaryHeader />
        <div className='flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-12 text-center shadow-card'>
          <p className='text-base font-medium text-foreground'>
            Statistics unavailable
          </p>
          <p className='text-sm text-muted-foreground'>Try to reload page</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 p-2'>
      <SummaryHeader />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        <KpiCard
          label='Meetings'
          value={summaryData.meetings.total}
          icon={<Video className='h-4 w-4' />}
          accent
        />
        <KpiCard
          label='Unique participants'
          value={summaryData.participants.total_unique}
          icon={<Users className='h-4 w-4' />}
        />
        <KpiCard
          label='Tasks'
          value={summaryData.tasks.total}
          icon={<CheckSquare className='h-4 w-4' />}
        />
        <KpiCard
          label='Follow-ups'
          value={summaryData.followups.total}
          icon={<ListChecks className='h-4 w-4' />}
        />
        <KpiCard
          label='Summaries'
          value={summaryData.summaries.total}
          icon={<FileText className='h-4 w-4' />}
        />
      </div>

      <StatsSection data={summaryData} />
    </div>
  );
}
