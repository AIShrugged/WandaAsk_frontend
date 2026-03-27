'use client';

import { useState } from 'react';

interface AgentsTabsProps {
  tasksContent: React.ReactNode;
  profilesContent: React.ReactNode;
  activityContent: React.ReactNode;
}

const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'activity', label: 'Activity' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * AgentsTabs component.
 * Client-side tab switcher for the agents page.
 * @param props - Component props.
 * @param props.tasksContent - Content for the Tasks tab.
 * @param props.profilesContent - Content for the Profiles tab.
 * @param props.activityContent - Content for the Activity tab.
 * @returns JSX element.
 */
export function AgentsTabs({
  tasksContent,
  profilesContent,
  activityContent,
}: AgentsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');

  return (
    <div className='flex flex-col gap-5 h-full'>
      <div className='flex gap-1 border-b border-border'>
        {TABS.map((tab) => {
          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={[
                'cursor-pointer px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className='flex-1 overflow-y-auto'>
        {activeTab === 'tasks' && tasksContent}
        {activeTab === 'profiles' && profilesContent}
        {activeTab === 'activity' && activityContent}
      </div>
    </div>
  );
}
