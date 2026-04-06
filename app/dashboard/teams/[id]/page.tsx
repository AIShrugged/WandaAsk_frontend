import React from 'react';

import { getTelegramChats } from '@/features/chat/api/telegram';
import { getTeamNotificationSettings } from '@/features/teams/api/notification-settings';
import { getTeam } from '@/features/teams/api/team';
import { getTeamDashboard } from '@/features/teams/api/team-dashboard';
import TeamDashboardKpis from '@/features/teams/ui/dashboard/team-dashboard-kpis';
import TeamDashboardMeetingBanner from '@/features/teams/ui/dashboard/team-dashboard-meeting-banner';
import TeamDashboardSections from '@/features/teams/ui/dashboard/team-dashboard-sections';
import TeamDashboardTabs from '@/features/teams/ui/dashboard/team-dashboard-tabs';
import TeamMembers from '@/features/teams/ui/team-members';
import TeamNotificationSettings from '@/features/teams/ui/team-notification-settings';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

/**
 * Page component.
 * @param props - Component props.
 * @param props.params
 * @param props.searchParams
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = 'status' } = await searchParams;

  const [teamResult, settingsResult, chatsResult, dashboardResult] =
    await Promise.allSettled([
      getTeam(id),
      getTeamNotificationSettings(id),
      getTelegramChats(),
      getTeamDashboard(id),
    ]);

  const team = teamResult.status === 'fulfilled' ? teamResult.value.data : null;

  if (!team) return null;

  const settings =
    settingsResult.status === 'fulfilled' ? settingsResult.value : [];
  const allChats = chatsResult.status === 'fulfilled' ? chatsResult.value : [];
  const teamChats = allChats.filter((c) => {
    return c.team_id === team.id && c.bound_at !== null;
  });
  const dashboard =
    dashboardResult.status === 'fulfilled'
      ? dashboardResult.value.data
      : null;

  return (
    <Card className='min-h-full flex flex-col overflow-y-auto'>
      <PageHeader hasButtonBack title={team.name} />

      {dashboard && (
        <>
          <div className='px-6 py-4 border-b border-border flex-shrink-0'>
            <TeamDashboardKpis kpis={dashboard.kpis} />
          </div>

          {dashboard.upcoming_meeting && (
            <TeamDashboardMeetingBanner
              meeting={dashboard.upcoming_meeting}
            />
          )}

          <TeamDashboardTabs currentTab={tab} tabs={dashboard.tabs} />

          {(dashboard.sections.since_last_week.length > 0 ||
            dashboard.sections.deadlines_and_priorities.length > 0 ||
            dashboard.sections.decisions_needed.length > 0) && (
            <div className='border-t border-border px-6 py-4 flex-shrink-0'>
              <TeamDashboardSections sections={dashboard.sections} />
            </div>
          )}
        </>
      )}

      <TeamMembers data={team} />
      <TeamNotificationSettings
        teamId={team.id}
        settings={settings}
        availableChats={teamChats}
      />
    </Card>
  );
}
