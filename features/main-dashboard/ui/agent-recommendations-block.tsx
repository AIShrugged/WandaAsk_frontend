import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type { AgentTask } from '@/features/agents/model/types';
import type { DashboardApiResponse } from '@/features/summary/types';

type RecommendationSeverity = 'info' | 'warning' | 'success' | 'tip';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: RecommendationSeverity;
  href?: string;
  linkLabel?: string;
}

const SEVERITY_CONFIG: Record<
  RecommendationSeverity,
  { icon: React.ReactNode; className: string }
> = {
  info: {
    icon: <TrendingUp className='h-4 w-4' />,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  warning: {
    icon: <AlertCircle className='h-4 w-4' />,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  success: {
    icon: <CheckCircle2 className='h-4 w-4' />,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  tip: {
    icon: <Lightbulb className='h-4 w-4' />,
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
};

/**
 * Derive recommendations from live dashboard data.
 * @param summary
 * @param agentTasks
 */
function buildRecommendations(
  summary: DashboardApiResponse | null,
  agentTasks: AgentTask[],
): Recommendation[] {
  const items: Recommendation[] = [];

  if (!summary) {
    items.push({
      id: 'no-data',
      title: 'Statistics unavailable',
      description:
        'Unable to load dashboard statistics. Check your connection and reload the page.',
      severity: 'warning',
    });

    return items;
  }

  // Overdue tasks
  if (summary.tasks.overdue > 0) {
    items.push({
      id: 'overdue',
      title: `${summary.tasks.overdue} overdue task${summary.tasks.overdue > 1 ? 's' : ''}`,
      description:
        'Some tasks have passed their deadline. Review and update their status.',
      severity: 'warning',
      href: ROUTES.DASHBOARD.SUMMARY,
      linkLabel: 'View tasks',
    });
  }

  // Low follow-up completion
  const followupTotal = summary.followups.total;

  if (followupTotal > 0) {
    const doneRate = summary.followups.by_status.done / followupTotal;

    if (doneRate < 0.5) {
      items.push({
        id: 'followups',
        title: 'Low follow-up completion rate',
        description: `Only ${Math.round(doneRate * 100)}% of follow-ups are done. Consider reviewing open items.`,
        severity: 'info',
        href: ROUTES.DASHBOARD.FOLLOWUPS,
        linkLabel: 'View follow-ups',
      });
    }
  }

  // Meetings without bot coverage
  const meetingsWithoutBot = summary.meetings.total - summary.meetings.with_bot;

  if (summary.meetings.total > 0 && meetingsWithoutBot > 0) {
    items.push({
      id: 'bot-coverage',
      title: `${meetingsWithoutBot} meeting${meetingsWithoutBot > 1 ? 's' : ''} without bot`,
      description:
        'Enable the recording bot to get AI summaries and task extraction for all meetings.',
      severity: 'tip',
      href: ROUTES.DASHBOARD.CALENDAR,
      linkLabel: 'Open calendar',
    });
  }

  // Disabled agent tasks
  const disabledTasks = agentTasks.filter((t) => {
    return !t.enabled;
  });

  if (disabledTasks.length > 0) {
    items.push({
      id: 'disabled-agents',
      title: `${disabledTasks.length} agent task${disabledTasks.length > 1 ? 's' : ''} disabled`,
      description: `${disabledTasks
        .map((t) => {
          return t.name;
        })
        .join(', ')} — consider re-enabling to keep automations running.`,
      severity: 'info',
      href: ROUTES.DASHBOARD.AGENT_TASKS,
      linkLabel: 'View tasks',
    });
  }

  // Failed agent task runs
  const failedRuns = agentTasks.filter((t) => {
    const s = t.latest_run_status?.toLowerCase();

    return s === 'failed' || s === 'error';
  });

  if (failedRuns.length > 0) {
    items.push({
      id: 'failed-runs',
      title: `${failedRuns.length} agent task${failedRuns.length > 1 ? 's' : ''} failed`,
      description: `${failedRuns
        .map((t) => {
          return t.name;
        })
        .join(', ')} — check logs and retry.`,
      severity: 'warning',
      href: ROUTES.DASHBOARD.AGENT_TASKS,
      linkLabel: 'View tasks',
    });
  }

  // Positive: everything healthy
  if (items.length === 0) {
    items.push({
      id: 'all-good',
      title: 'All systems nominal',
      description:
        'No issues detected. Your meetings, tasks, and agents are running smoothly.',
      severity: 'success',
    });
  }

  // Tip: top participant engagement
  if (summary.participants.top.length > 0) {
    const top = summary.participants.top[0];

    items.push({
      id: 'top-participant',
      title: 'Most active participant',
      description: `${top.name} attended ${top.meetings_count} ${top.meetings_count === 1 ? 'meeting' : 'meetings'}. Great collaboration!`,
      severity: 'tip',
    });
  }

  return items.slice(0, 5);
}

interface AgentRecommendationsBlockProps {
  summary: DashboardApiResponse | null;
  agentTasks: AgentTask[];
}

/**
 * AgentRecommendationsBlock — AI-derived insights and action items.
 * @param root0
 * @param root0.summary
 * @param root0.agentTasks
 */
export function AgentRecommendationsBlock({
  summary,
  agentTasks,
}: AgentRecommendationsBlockProps) {
  const recommendations = buildRecommendations(summary, agentTasks);

  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center gap-2 px-5 py-4 border-b border-border'>
        <Lightbulb className='h-4 w-4 text-violet-400' />
        <h2 className='text-base font-semibold text-foreground'>
          Insights & Recommendations
        </h2>
      </div>
      <div className='flex flex-col gap-3 p-5'>
        {recommendations.map((rec) => {
          const config = SEVERITY_CONFIG[rec.severity];

          return (
            <div
              key={rec.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${config.className}`}
            >
              <div className='shrink-0 mt-0.5'>{config.icon}</div>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold leading-snug'>
                  {rec.title}
                </p>
                <p className='text-xs mt-0.5 opacity-80'>{rec.description}</p>
                {rec.href && rec.linkLabel && (
                  <Link
                    href={rec.href}
                    className='text-xs underline opacity-80 hover:opacity-100 mt-1 inline-block'
                  >
                    {rec.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
