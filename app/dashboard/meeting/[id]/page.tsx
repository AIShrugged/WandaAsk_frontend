import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import { getEvent } from '@/features/event/api/calendar-events';
import EventOverview from '@/features/event/ui/event-overview';
import {
  available_tabs,
  type Tab,
  validTabs,
} from '@/features/meeting/lib/options';
import Transcript from '@/features/transcript/ui/transcript';
import { ROUTES } from '@/shared/lib/routes';
import ButtonsRow from '@/shared/ui/button/ButtonsRow';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';
import FollowUpData from '@/features/follow-up/ui/follow-up-data';
import AnalysisData from '@/features/analysis/ui/AnalysisData';

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = available_tabs.summary } = await searchParams;

  const { data: event } = await getEvent(id);
  const currentTab = validTabs.includes(tab as Tab) ? tab : 'summary';

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
              <EventOverview id={id} event={event} />
            )}
            {currentTab === available_tabs.followup && (
              <FollowUpData id={+id} />
            )}
            {currentTab === available_tabs.transcript && <Transcript id={id} />}
            {currentTab === available_tabs.analysis && (
              <AnalysisData id={+id} />
            )}
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
}
