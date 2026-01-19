import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { type PropsWithChildren, Suspense } from 'react';

import { getEvents } from '@/app/actions/calendar-events';
import { getSources } from '@/app/actions/source';
import Calendar from '@/features/calendar/client/calendar';
import OnboardingTrigger from '@/features/calendar/client/onboarding-trigger';
import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { EventProps } from '@/features/event/model/types';

const Wrapper = ({ children }: PropsWithChildren) => (
  <Card className='h-full flex flex-col overflow-hidden'>{children}</Card>
);

const UnattachedView = () => (
  <Wrapper>
    <OnboardingTrigger />
  </Wrapper>
);

const AttachedView = ({
  events,
  currentMonth,
}: {
  events: EventProps[];
  currentMonth: string;
}) => (
  <Wrapper>
    <Suspense fallback={<SpinLoader />}>
      <Calendar currentMonth={currentMonth} events={events} />
    </Suspense>
  </Wrapper>
);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ attached?: string; month?: string }>;
}) {
  const params = await searchParams;

  if (params?.attached === '1') {
    revalidatePath('/dashboard/calendar');
    redirect('/dashboard/calendar');
  }

  const { data } = await getSources();
  const isCalendarAttached = data?.length > 0;

  // Redirect to canonical URL with current month if month is not in URL
  if (isCalendarAttached && !params.month) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    redirect(`/dashboard/calendar?month=${currentMonth}`);
  }

  const month = params.month ?? new Date().toISOString().slice(0, 7) + '-01';

  const { data: events } = await getEvents();

  return isCalendarAttached ? (
    <AttachedView currentMonth={month} events={events} />
  ) : (
    <UnattachedView />
  );
}
