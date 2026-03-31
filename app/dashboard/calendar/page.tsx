import { redirect } from 'next/navigation';
import { type PropsWithChildren, Suspense } from 'react';

import { getSources } from '@/features/calendar/api/source';
import CalendarAttachedToast from '@/features/calendar/ui/calendar-attached-toast';
import OnboardingTrigger from '@/features/calendar/ui/onboarding-trigger';
import { getEvents } from '@/features/event/api/calendar-events';
import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import { CalendarPage } from '@/widgets/calendar-view';

import type { EventProps } from '@/entities/event';

/**
 * Wrapper component.
 * @param props - Component props.
 * @param props.children
 */
const Wrapper = ({ children }: PropsWithChildren) => {
  return (
    <Card className='h-full flex flex-col overflow-hidden'>{children}</Card>
  );
};
/**
 * UnattachedView component.
 */
const UnattachedView = () => {
  return (
    <Wrapper>
      <OnboardingTrigger />
    </Wrapper>
  );
};
/**
 * AttachedView component.
 * @param root0
 * @param root0.events
 * @param root0.currentMonth
 * @param root0.justAttached
 */
const AttachedView = ({
  events,
  currentMonth,
  justAttached,
}: {
  events: EventProps[];
  currentMonth: string;
  justAttached: boolean;
}) => {
  return (
    <Wrapper>
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
    </Wrapper>
  );
};

/**
 * Page component.
 * @param root0
 * @param root0.searchParams
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ attached?: string; month?: string }>;
}) {
  const params = await searchParams;
  const justAttached = params?.attached === '1';
  const sources = await getSources();
  const isCalendarAttached = sources.some((s) => {
    return s.is_connected === '1' || s.is_connected === true;
  });

  if (isCalendarAttached && !params.month) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const suffix = justAttached ? '&attached=1' : '';

    redirect(`/dashboard/calendar?month=${currentMonth}${suffix}`);
  }

  if (!isCalendarAttached) {
    return <UnattachedView />;
  }

  const month = params.month ?? new Date().toISOString().slice(0, 7) + '-01';
  const { data: events } = await getEvents();

  return (
    <AttachedView
      currentMonth={month}
      events={events}
      justAttached={justAttached}
    />
  );
}
