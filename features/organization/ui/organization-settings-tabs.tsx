'use client';

import { useState } from 'react';

interface OrganizationSettingsTabsProps {
  generalContent: React.ReactNode;
  taskTypesContent: React.ReactNode;
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'issue-types', label: 'Task Types' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * OrganizationSettingsTabs component.
 * @param props - Component props.
 * @param props.generalContent - Content for the General tab.
 * @param props.taskTypesContent - Content for the Task Types tab.
 * @returns JSX element.
 */
export function OrganizationSettingsTabs({
  generalContent,
  taskTypesContent,
}: OrganizationSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

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
        {activeTab === 'general' && generalContent}
        {activeTab === 'issue-types' && taskTypesContent}
      </div>
    </div>
  );
}
