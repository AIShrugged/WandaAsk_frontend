'use client';

import { useState } from 'react';

interface DashboardTabsProps {
  mainContent: React.ReactNode;
  statisticsContent: React.ReactNode;
}

const TABS = [
  { id: 'main', label: 'Main' },
  { id: 'statistics', label: 'Statistics' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * DashboardTabs component.
 * Client-side tab switcher for the main dashboard page.
 * Tab 1: Main dashboard overview. Tab 2: Statistics summary.
 * @param props - Component props.
 * @param props.mainContent - Content for the Main tab.
 * @param props.statisticsContent - Content for the Statistics tab.
 * @returns JSX element.
 */
export function DashboardTabs({
  mainContent,
  statisticsContent,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('main');

  return (
    <div className='flex flex-col gap-5 h-full'>
      {/* Tab bar */}
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

      {/* Tab panels */}
      <div className='flex-1 overflow-y-auto'>
        {activeTab === 'main' && mainContent}
        {activeTab === 'statistics' && statisticsContent}
      </div>
    </div>
  );
}
