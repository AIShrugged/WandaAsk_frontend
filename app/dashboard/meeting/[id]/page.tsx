import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import { getEvent, getFollowUps } from '@/app/actions/calendar-events';
import { getfollowUp } from '@/app/actions/follow-up';
import { getAttendees, getGuests } from '@/app/actions/participants';
import Analysis from '@/features/analysis/ui/analysis';
import EventOverview from '@/features/event/ui/event-overview';
import FollowUp from '@/features/follow-up/ui/follow-up';
import { available_tabs } from '@/features/meeting/lib/options';
import Transcript from '@/features/transcript/ui/transcript';
import { ROUTES } from '@/shared/lib/routes';
import ButtonsRow from '@/shared/ui/button/ButtonsRow';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import PageHeader from '@/widgets/layout/ui/page-header';

import type {
  FollowUpResponse,
  FollowUpsResponse,
} from '@/features/follow-up/model/types';
import type { PageProps } from '@/shared/types/common';

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = available_tabs.summary } = await searchParams;

  const { data: event } = await getEvent(id);

  const [{ data: attendees = [] }, { data: guests = [] }] = await Promise.all([
    getAttendees(id),
    getGuests(id),
  ]);

  const followUps: FollowUpsResponse = await getFollowUps(+id);

  if (!followUps?.data || followUps.data.length === 0) {
    return <div>No analysis</div>;
  }

  const latestId = Math.max(...followUps.data.map(item => item.id));
  const followUp = await getfollowUp(+latestId);

  const validTabs = ['summary', 'followup', 'transcript', 'analysis'] as const;
  const currentTab = validTabs.includes(tab as any) ? tab : 'summary';

  if (tab !== currentTab)
    redirect(`${ROUTES.DASHBOARD.MEETING}/${id}?tab=${currentTab}`);

  return (
    <Card className='h-full flex flex-col overflow-y-scroll'>
      <PageHeader hasButtonBack title={event.title} />

      <CardBody>
        <div>
          <ButtonsRow currentTab={tab} />
        </div>

        <div className='mt-8'>
          <Suspense fallback={<SpinLoader />} key={currentTab}>
            {currentTab === available_tabs.summary && (
              <EventOverview
                id={id}
                guests={guests}
                attendees={attendees}
                event={event}
              />
            )}
            {currentTab === available_tabs.followup && (
              <FollowUp id={Number(id)} />
            )}
            {currentTab === available_tabs.transcript && <Transcript id={id} />}
            {currentTab === available_tabs.analysis && (
              <Analysis data={followUp?.data?.text} />
            )}
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
}
