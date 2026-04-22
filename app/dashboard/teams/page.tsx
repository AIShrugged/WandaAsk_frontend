import { redirect } from 'next/navigation';
import React from 'react';

import { getTelegramChats } from '@/features/chat';
import {
  getTeamNotificationSettings,
  getTeam,
  getTeamInvites,
  getTeams,
  getTeamDashboard,
  TeamsEmptyState,
  TeamsPageClient,
} from '@/features/teams';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

interface SearchParams {
  team_id?: string;
  tab?: string;
}

/**
 * Page component — single-page teams view with dropdown team selector.
 * @param props - Component props.
 * @param props.searchParams
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { team_id, tab = 'status' } = await searchParams;

  const organizationId = await getOrganizationId();
  const { data: teams = [] } = await getTeams(organizationId);

  if (teams.length === 0) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Teams' />
        <TeamsEmptyState />
      </Card>
    );
  }

  // Redirect to first team if no team_id in URL
  if (!team_id) {
    redirect(`${ROUTES.DASHBOARD.TEAMS}?team_id=${teams[0].id}`);
  }

  const resolvedTeamId = String(team_id);

  const [
    teamResult,
    settingsResult,
    chatsResult,
    dashboardResult,
    invitesResult,
  ] = await Promise.allSettled([
    getTeam(resolvedTeamId),
    getTeamNotificationSettings(resolvedTeamId),
    getTelegramChats(),
    getTeamDashboard(resolvedTeamId),
    getTeamInvites(resolvedTeamId),
  ]);

  const team = teamResult.status === 'fulfilled' ? teamResult.value.data : null;

  if (!team) {
    redirect(`${ROUTES.DASHBOARD.TEAMS}?team_id=${teams[0].id}`);
  }

  const settings =
    settingsResult.status === 'fulfilled' ? settingsResult.value : [];
  const allChats = chatsResult.status === 'fulfilled' ? chatsResult.value : [];
  const teamChats = allChats.filter((c) => {
    return c.team_id === team.id && c.bound_at !== null;
  });
  const dashboard =
    dashboardResult.status === 'fulfilled'
      ? (dashboardResult.value.data ?? null)
      : null;

  const pendingInvites =
    invitesResult.status === 'fulfilled' ? invitesResult.value : [];

  // Derive manager status: look up the current viewer in team.members by id.
  // Falls back to false for org-level managers not explicitly in the members list.
  const viewerId = dashboard?.viewer.id ?? null;
  const viewerMember = viewerId
    ? (team.members.find((m) => {
        return m.id === viewerId;
      }) ?? null)
    : null;
  // TeamMember type does not expose role yet — treat presence in list as manager signal.
  // Request viewer.is_manager from backend dashboard payload for more accurate detection.
  const isManager = viewerMember !== null;

  return (
    <Card className='min-h-full flex flex-col overflow-y-auto'>
      <PageHeader title='Teams' />

      <TeamsPageClient
        teams={teams}
        team={team}
        dashboard={dashboard}
        settings={settings}
        availableChats={teamChats}
        pendingInvites={pendingInvites}
        isManager={isManager}
        currentTab={tab}
      />
    </Card>
  );
}
