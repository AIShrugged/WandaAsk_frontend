'use client';

import { Bot } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  getAgentTaskRun,
  getAgentTaskRuns,
} from '@/features/agents/api/agents';
import { AgentTaskOverview } from '@/features/agents/ui/agent-task-overview';
import { AgentTaskRunDetail } from '@/features/agents/ui/agent-task-run-detail';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import { InlineRunsList } from './inline-runs-list';

import type { AgentTask, AgentTaskRun } from '@/features/agents/model/types';

const PANEL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'runs', label: 'Runs' },
] as const;

/**
 * AgentTaskDetailPanel — inline detail panel for a selected task.
 * Shows Overview and Runs tabs with client-side data fetching.
 * @param root0
 * @param root0.task
 */
export function AgentTaskDetailPanel({ task }: { task: AgentTask }) {
  const [activeTab, setActiveTab] =
    useState<(typeof PANEL_TABS)[number]['key']>('overview');
  const [runs, setRuns] = useState<AgentTaskRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AgentTaskRun | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runDetailLoading, setRunDetailLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'runs') return;

    let cancelled = false;

    async function fetchRuns() {
      setRunsLoading(true);
      setRunsError(null);

      try {
        const result = await getAgentTaskRuns(task.id);

        if (!cancelled) {
          setRuns(result.data);
        }
      } catch (error) {
        if (!cancelled) {
          setRunsError(
            error instanceof Error ? error.message : 'Failed to load runs',
          );
        }
      } finally {
        if (!cancelled) {
          setRunsLoading(false);
        }
      }
    }

    void fetchRuns();

    return () => {
      cancelled = true;
    };
  }, [task.id, activeTab]);

  async function handleSelectRun(runId: number) {
    setRunDetailLoading(true);

    try {
      const run = await getAgentTaskRun(task.id, runId);

      setSelectedRun(run);
    } catch {
      setSelectedRun(null);
    } finally {
      setRunDetailLoading(false);
    }
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='px-5 pt-4 pb-3 border-b border-border/50'>
        <h3 className='text-base font-semibold text-foreground truncate'>
          {task.name}
        </h3>
      </div>

      {/* Tabs */}
      <div className='px-5 pt-3 border-b border-border/50'>
        <nav className='flex gap-1 -mb-px' role='tablist'>
          {PANEL_TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type='button'
                role='tab'
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.key);
                }}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-5 py-4'>
        {activeTab === 'overview' && <AgentTaskOverview task={task} />}

        {activeTab === 'runs' && (
          <div className='flex flex-col gap-4'>
            {runsError && (
              <EmptyState
                icon={Bot}
                title='Failed to load runs'
                description={runsError}
              />
            )}

            {!runsError && runs.length > 0 && (
              <>
                <InlineRunsList
                  runs={runs}
                  selectedRunId={selectedRun?.id}
                  onSelectRun={handleSelectRun}
                  loading={runsLoading}
                />

                {runDetailLoading && (
                  <Skeleton className='h-32 rounded-[var(--radius-card)]' />
                )}

                {selectedRun && !runDetailLoading && (
                  <AgentTaskRunDetail run={selectedRun} />
                )}

                {!selectedRun && !runDetailLoading && (
                  <p className='text-sm text-muted-foreground text-center py-2'>
                    Click a run to view details
                  </p>
                )}
              </>
            )}

            {!runsLoading &&
              !runsError &&
              runs.length === 0 &&
              !selectedRun && (
                <EmptyState
                  icon={Bot}
                  title='No runs yet'
                  description='Run the task manually or wait for the next scheduled execution.'
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
