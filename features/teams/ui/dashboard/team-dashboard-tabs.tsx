'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import TeamDashboardTabHealth from './team-dashboard-tab-health';
import TeamDashboardTabPeople from './team-dashboard-tab-people';
import TeamDashboardTabReadiness from './team-dashboard-tab-readiness';
import TeamDashboardTabRisks from './team-dashboard-tab-risks';
import TeamDashboardTabSettings from './team-dashboard-tab-settings';
import TeamDashboardTabStatus from './team-dashboard-tab-status';

import type {
  TabHealth,
  TabMeetingReadiness,
  TabPeople,
  TabRisks,
  TabStatus,
} from '../../model/dashboard-types';
import type { TelegramChatRegistration } from '@/features/chat/types';
import type { TeamNotificationSetting } from '@/features/teams/model/types';

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

const TABS = [
  { key: 'status', label: 'Status' },
  { key: 'readiness', label: 'Readiness' },
  { key: 'people', label: 'People' },
  { key: 'health', label: 'Health' },
  { key: 'risks', label: 'Risks' },
  { key: 'settings', label: 'Settings' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface DashboardTabs {
  status: TabStatus;
  meeting_readiness: TabMeetingReadiness;
  people: TabPeople;
  health: TabHealth;
  risks: TabRisks;
}

interface TeamDashboardTabsProps {
  currentTab: string;
  tabs: DashboardTabs | null;
  teamId: number;
  members: TeamMember[];
  settings: TeamNotificationSetting[];
  availableChats: TelegramChatRegistration[];
}

/**
 * TeamDashboardTabs — URL-driven tab strip with tab content.
 * @param props - Component props.
 * @param props.currentTab
 * @param props.tabs
 * @param props.teamId
 * @param props.members
 * @param props.settings
 * @param props.availableChats
 */
export default function TeamDashboardTabs({
  currentTab,
  tabs,
  teamId,
  members,
  settings,
  availableChats,
}: TeamDashboardTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: TabKey = TABS.some((t) => {
    return t.key === currentTab;
  })
    ? (currentTab as TabKey)
    : 'status';

  const handleTabChange = (key: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className='flex flex-col flex-1 overflow-hidden'>
      {/* Tab strip */}
      <div className='flex gap-1 border-b border-border px-6 flex-shrink-0'>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type='button'
              onClick={() => {
                return handleTabChange(tab.key);
              }}
              className={[
                'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        {activeTab === 'settings' && (
          <TeamDashboardTabSettings
            teamId={teamId}
            members={members}
            settings={settings}
            availableChats={availableChats}
          />
        )}
        {activeTab !== 'settings' && tabs && (
          <>
            {activeTab === 'status' && (
              <TeamDashboardTabStatus data={tabs.status} />
            )}
            {activeTab === 'readiness' && (
              <TeamDashboardTabReadiness data={tabs.meeting_readiness} />
            )}
            {activeTab === 'people' && (
              <TeamDashboardTabPeople data={tabs.people} />
            )}
            {activeTab === 'health' && (
              <TeamDashboardTabHealth data={tabs.health} />
            )}
            {activeTab === 'risks' && (
              <TeamDashboardTabRisks data={tabs.risks} />
            )}
          </>
        )}
        {activeTab !== 'settings' && !tabs && (
          <p className='text-sm text-muted-foreground text-center py-10'>
            No dashboard data available.
          </p>
        )}
      </div>
    </div>
  );
}
