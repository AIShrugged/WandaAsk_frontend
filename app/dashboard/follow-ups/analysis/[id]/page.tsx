import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';

import {
  DeprecatedFollowUpModal,
  ExportButton,
  FollowUpAnalysis,
} from '@/features/follow-up';
import {
  available_tabs,
  type Tab,
  validTabs,
} from '@/features/meeting/lib/options';
import ButtonsRow from '@/features/meeting/ui/buttons-row';
import { getMethodologyChat } from '@/features/methodology/api/methodology-chat';
import { getTeamFollowUp } from '@/features/teams/api/team';
import Transcript from '@/features/transcript/ui/transcript';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import SpinLoader from '@/shared/ui/layout/spin-loader';
import PageHeader from '@/widgets/layout/ui/page-header';
import EventOverview from '@/widgets/meeting/ui/event-overview';

import type { PageProps } from '@/shared/types/common';

/**
 * Page component.
 * @param searchParams.params
 * @param searchParams - searchParams.
 * @param searchParams.searchParams
 * @returns JSX element.
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;

  const { tab = available_tabs.summary } = await searchParams;

  const { data: followUp } = await getTeamFollowUp(id);

  const currentTab = validTabs.includes(tab as Tab) ? (tab as Tab) : 'summary';

  // Resolve the methodology chat once at page level so FollowUpAnalysis
  // receives a plain chatId — keeping FSD boundaries clean.
  const methodologyChat =
    currentTab === available_tabs.analysis && followUp.methodology_id
      ? await getMethodologyChat(followUp.methodology_id)
      : null;

  if (tab !== currentTab)
    redirect(`${ROUTES.DASHBOARD.FOLLOWUPS}/analysis/${id}?tab=${currentTab}`);

  return (
    <Card className='h-full flex flex-col overflow-y-scroll'>
      <div className='flex items-center justify-between pr-4'>
        <PageHeader hasButtonBack title={followUp.calendar_event.title} />
        <ExportButton followUpId={followUp.id} />
      </div>

      <CardBody>
        {followUp.is_deprecated && (
          <DeprecatedFollowUpModal followUpId={followUp.id} />
        )}

        <div>
          <ButtonsRow currentTab={tab} />
        </div>

        <div className='mt-8'>
          <Suspense fallback={<SpinLoader />} key={currentTab}>
            {currentTab === available_tabs.summary && (
              <EventOverview
                id={id}
                event={followUp.calendar_event}
                withoutMatcher
              />
            )}
            {currentTab === available_tabs.transcript && <Transcript id={id} />}
            {currentTab === available_tabs.analysis && (
              <FollowUpAnalysis chatId={methodologyChat?.id ?? null} />
            )}
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
}
