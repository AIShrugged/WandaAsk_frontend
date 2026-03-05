import { redirect } from 'next/navigation';
import { type PropsWithChildren, Suspense } from 'react';

import { getSources } from '@/features/calendar/api/source';
import Calendar from '@/features/calendar/ui/calendar';
import OnboardingTrigger from '@/features/calendar/ui/onboarding-trigger';
import { getEvents } from '@/features/event/api/calendar-events';
import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

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
 */
const AttachedView = ({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) => {
  return (
    <Wrapper>
      <Suspense
        fallback={
          <div className='flex flex-1 items-center justify-center'>
            <SpinLoader />
          </div>
        }
      >
        <Calendar currentMonth={currentMonth} events={events} />
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

  if (params?.attached === '1') {
    redirect('/dashboard/calendar');
  }

  const { data } = await getSources();

  const isCalendarAttached = data?.length > 0;

  if (isCalendarAttached && !params.month) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    redirect(`/dashboard/calendar?month=${currentMonth}`);
  }

  if (!isCalendarAttached) {
    return <UnattachedView />;
  }

  const month = params.month ?? new Date().toISOString().slice(0, 7) + '-01';

  const { data: events } = await getEvents();

  return <AttachedView currentMonth={month} events={events} />;
}
