import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import Analysis from '@/features/analysis/ui/analysis';
import {
  getEventFollowUp,
  getMeetingTasks,
} from '@/features/event/api/calendar-events';
import FollowUp from '@/features/follow-up/ui/follow-up';
import {
  available_tabs,
  type Tab,
  validTabs,
} from '@/features/meeting/lib/options';
import ButtonsRow from '@/features/meeting/ui/buttons-row';
import MeetingTasks from '@/features/meeting/ui/meeting-tasks';
import Transcript from '@/features/transcript/ui/transcript';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import PageHeader from '@/widgets/layout/ui/page-header';
import EventOverview from '@/widgets/meeting/ui/event-overview';

import type { PageProps } from '@/shared/types/common';

/**
 *
 * @param root0
 * @param root0.id
 */
async function TasksTab({ id }: { id: string }) {
  const tasks = await getMeetingTasks(id);

  return <MeetingTasks tasks={tasks} />;
}

/**
 * Page component.
 * @param searchParams.params
 * @param searchParams - searchParams.
 * @param searchParams.searchParams
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;

  const { tab = available_tabs.summary } = await searchParams;

  const { data: followUp } = await getEventFollowUp(id);

  const currentTab = validTabs.includes(tab as Tab) ? (tab as Tab) : 'summary';

  if (tab !== currentTab)
    redirect(`${ROUTES.DASHBOARD.MEETING}/${id}?tab=${currentTab}`);

  return (
    <Card className='h-full flex flex-col overflow-y-scroll'>
      <PageHeader hasButtonBack title={followUp.calendar_event.title} />

      <CardBody>
        <div>
          <ButtonsRow currentTab={tab} />
        </div>

        <div className='mt-8'>
          <Suspense fallback={<SpinLoader />} key={currentTab}>
            {currentTab === available_tabs.summary && (
              <EventOverview id={id} event={followUp.calendar_event} />
            )}
            {currentTab === available_tabs.followup && (
              <FollowUp data={followUp?.text} />
            )}
            {currentTab === available_tabs.transcript && <Transcript id={id} />}
            {currentTab === available_tabs.analysis && (
              <Analysis data={followUp?.text} />
            )}
            {currentTab === available_tabs.tasks && <TasksTab id={id} />}
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
}
