'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import TeamDashboardKpis from '@/features/teams/ui/dashboard/team-dashboard-kpis';
import TeamDashboardMeetingBanner from '@/features/teams/ui/dashboard/team-dashboard-meeting-banner';
import TeamDashboardSections from '@/features/teams/ui/dashboard/team-dashboard-sections';
import TeamDashboardTabs from '@/features/teams/ui/dashboard/team-dashboard-tabs';
import TeamsHeader from '@/features/teams/ui/teams-header';

import type { TeamInvite, TeamProps } from '@/entities/team';
import type { TelegramChatRegistration } from '@/features/chat/types';
import type { TeamDashboardData } from '@/features/teams/model/dashboard-types';
import type { TeamNotificationSetting } from '@/features/teams/model/types';

interface TeamsPageClientProps {
  teams: TeamProps[];
  team: TeamProps;
  dashboard: TeamDashboardData | null;
  settings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
  pendingInvites: TeamInvite[];
  isManager: boolean;
  currentTab: string;
}

/**
 * TeamsPageClient — client wrapper for the teams single-page layout.
 * Owns the team selector dropdown and URL navigation logic.
 */
export default function TeamsPageClient({
  teams,
  team,
  dashboard,
  settings,
  availableChats,
  pendingInvites,
  isManager,
  currentTab,
}: TeamsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTeamChange = (id: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('team_id', String(id));
    params.delete('tab');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className='flex flex-col flex-1 overflow-hidden'>
      <TeamsHeader
        teams={teams}
        selectedTeamId={team.id}
        onTeamChange={handleTeamChange}
      />

      <div className='flex flex-col flex-1 overflow-y-auto'>
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

            <TeamDashboardTabs
              currentTab={currentTab}
              tabs={dashboard.tabs}
              teamId={team.id}
              members={team.members}
              pendingInvites={pendingInvites}
              isManager={isManager}
              settings={settings}
              availableChats={availableChats}
            />

            {currentTab === 'status' &&
              (dashboard.sections.since_last_week.length > 0 ||
                dashboard.sections.deadlines_and_priorities.length > 0 ||
                dashboard.sections.decisions_needed.length > 0) && (
                <div className='border-t border-border px-6 py-4 flex-shrink-0'>
                  <TeamDashboardSections sections={dashboard.sections} />
                </div>
              )}
          </>
        )}

        {!dashboard && (
          <TeamDashboardTabs
            currentTab={currentTab}
            tabs={null}
            teamId={team.id}
            members={team.members}
            pendingInvites={pendingInvites}
            isManager={isManager}
            settings={settings}
            availableChats={availableChats}
          />
        )}
      </div>
    </div>
  );
}
