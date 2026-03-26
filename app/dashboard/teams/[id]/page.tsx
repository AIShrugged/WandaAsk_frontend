import React from 'react';

import { getTelegramChats } from '@/features/chat/api/telegram';
import { getTeamNotificationSettings } from '@/features/teams/api/notification-settings';
import { getTeam } from '@/features/teams/api/team';
import TeamMembers from '@/features/teams/ui/team-members';
import TeamNotificationSettings from '@/features/teams/ui/team-notification-settings';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { PageProps } from '@/shared/types/common';

/**
 * Page component.
 * @param props - Component props.
 * @param props.params
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [teamResult, settingsResult, chatsResult] = await Promise.allSettled([
    getTeam(id),
    getTeamNotificationSettings(id),
    getTelegramChats(),
  ]);
  const team = teamResult.status === 'fulfilled' ? teamResult.value.data : null;

  if (!team) return null;

  const settings =
    settingsResult.status === 'fulfilled' ? settingsResult.value : [];
  const allChats = chatsResult.status === 'fulfilled' ? chatsResult.value : [];
  const teamChats = allChats.filter((c) => {
    return c.team_id === team.id && c.bound_at !== null;
  });

  return (
    <Card className='min-h-full h-full overflow-x-hidden overflow-y-scroll'>
      <PageHeader hasButtonBack title={team.name}></PageHeader>
      <TeamMembers data={team} />
      <TeamNotificationSettings
        teamId={team.id}
        settings={settings}
        availableChats={teamChats}
      />
    </Card>
  );
}
