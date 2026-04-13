import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { getCalendarEventDetail } from '@/features/event/api/calendar-events';
import { MeetingDetailTabsNav } from '@/features/meetings/ui/meeting-detail-tabs-nav';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type { ReactNode } from 'react';

/**
 * Meeting detail layout — wraps all sub-tab pages.
 * Fetches minimal event data to decide if the Protocol tab label should show.
 */
export default async function MeetingDetailLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;

  let hasProtocol = false;

  try {
    const { data } = await getCalendarEventDetail(id);

    hasProtocol = Boolean(data.event.has_summary);
  } catch {
    // If detail fetch fails (e.g. not found), proceed with default tab labels
  }

  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <div className='flex flex-col px-5 pt-4 gap-3'>
        <Link
          href={ROUTES.DASHBOARD.MEETINGS_LIST}
          className='inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80 w-fit'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Meetings
        </Link>
        <MeetingDetailTabsNav meetingId={id} hasProtocol={hasProtocol} />
      </div>
      <div className='flex-1 min-h-0 overflow-y-auto'>{children}</div>
    </Card>
  );
}
