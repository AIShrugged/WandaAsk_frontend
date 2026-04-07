import { redirect } from 'next/navigation';
import { type PropsWithChildren, Suspense } from 'react';

import { getSources } from '@/features/calendar/api/source';
import CalendarAttachedToast from '@/features/calendar/ui/calendar-attached-toast';
import OnboardingTrigger from '@/features/calendar/ui/onboarding-trigger';
import {
  getCalendarEvents,
  getEvents,
} from '@/features/event/api/calendar-events';
import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { MeetingsList } from '@/features/meetings/ui/meetings-list';
import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import { CalendarPage } from '@/widgets/calendar-view';

import type { EventProps } from '@/entities/event';

const TABS = [
  { id: 'meetings', label: 'Meetings' },
  { id: 'calendar', label: 'Calendar' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * MeetingsTabsNav component.
 * @param root0
 * @param root0.activeTab
 */
function MeetingsTabsNav({ activeTab }: { activeTab: TabId }) {
  return (
    <div className='flex gap-1 border-b border-border'>
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <a
            key={tab.id}
            href={`?tab=${tab.id}`}
            className={[
              'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}

/**
 * CalendarWrapper component.
 */
const CalendarWrapper = ({ children }: PropsWithChildren) => {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>{children}</Card>
  );
};

/**
 * CalendarUnattachedView component.
 */
const CalendarUnattachedView = () => {
  return (
    <CalendarWrapper>
      <OnboardingTrigger />
    </CalendarWrapper>
  );
};

/**
 * CalendarAttachedView component.
 * @param root0
 * @param root0.events
 * @param root0.currentMonth
 * @param root0.justAttached
 */
const CalendarAttachedView = ({
  events,
  currentMonth,
  justAttached,
}: {
  events: EventProps[];
  currentMonth: string;
  justAttached: boolean;
}) => {
  return (
    <CalendarWrapper>
      {justAttached && <CalendarAttachedToast />}
      <Suspense
        fallback={
          <div className='flex flex-1 items-center justify-center'>
            <SpinLoader />
          </div>
        }
      >
        <CalendarPage currentMonth={currentMonth} events={events} />
      </Suspense>
    </CalendarWrapper>
  );
};

/**
 * Meetings page.
 * @param root0
 * @param root0.searchParams
 */
export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; month?: string; attached?: string }>;
}) {
  const params = await searchParams;
  const activeTab = (
    params.tab === 'calendar' ? 'calendar' : 'meetings'
  ) as TabId;
  const justAttached = params.attached === '1';

  // If tab is calendar, handle calendar logic
  if (activeTab === 'calendar') {
    const sources = await getSources();
    const isCalendarAttached = sources.some((s) => {
      return s.is_connected === '1' || s.is_connected === true;
    });

    if (!isCalendarAttached) {
      return (
        <div className='h-full flex flex-col overflow-hidden'>
          <MeetingsTabsNav activeTab={activeTab} />
          <CalendarUnattachedView />
        </div>
      );
    }

    if (!params.month) {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const suffix = justAttached ? '&attached=1' : '';

      redirect(
        `/dashboard/meetings?tab=calendar&month=${currentMonth}${suffix}`,
      );
    }

    const month = params.month ?? new Date().toISOString().slice(0, 7) + '-01';
    const { data: events } = await getEvents();

    return (
      <div className='h-full flex flex-col overflow-hidden'>
        <MeetingsTabsNav activeTab={activeTab} />
        <CalendarAttachedView
          currentMonth={month}
          events={events}
          justAttached={justAttached}
        />
      </div>
    );
  }

  // Default: meetings tab
  const { data: meetings = [], totalCount } = await getCalendarEvents(
    0,
    MEETINGS_PAGE_SIZE,
  );

  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <MeetingsTabsNav activeTab={activeTab} />
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-4xl px-6 py-6'>
          <MeetingsList initialItems={meetings} totalCount={totalCount} />
        </div>
      </div>
    </Card>
  );
}
