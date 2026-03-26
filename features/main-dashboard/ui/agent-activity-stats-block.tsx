import { format, parseISO } from 'date-fns';
import { Activity, Bot, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import type { AgentActivityItem } from '@/features/agents/model/types';
import type { AgentStats } from '@/features/main-dashboard/lib/derive-agent-stats';

interface StatTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

/**
 *
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.accent
 */
function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className='flex flex-col gap-1 rounded-[var(--radius-card)] border border-border bg-card/50 px-4 py-3'>
      <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
        {label}
      </span>
      <p
        className={
          accent
            ? 'text-2xl font-bold text-primary tabular-nums'
            : 'text-2xl font-bold text-foreground tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}

interface AgentActivityStatsBlockProps {
  stats: AgentStats;
  recentActivity: AgentActivityItem[];
  activityTotal: number;
  canManageAgents: boolean;
}

/**
 * AgentActivityStatsBlock — shows agent activity stats and recent activity feed on the main dashboard.
 * @param root0
 * @param root0.stats
 * @param root0.recentActivity
 * @param root0.activityTotal
 * @param root0.canManageAgents
 */
export function AgentActivityStatsBlock({
  stats,
  recentActivity,
  activityTotal,
  canManageAgents,
}: AgentActivityStatsBlockProps) {
  return (
    <Card className='flex flex-col gap-0'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <Activity className='h-4 w-4 text-primary' />
          <h2 className='text-base font-semibold text-foreground'>
            Agent Activity
          </h2>
          {activityTotal > 0 && (
            <span className='text-xs text-muted-foreground'>
              ({activityTotal} total)
            </span>
          )}
        </div>
        {canManageAgents && (
          <Link
            href={ROUTES.DASHBOARD.AGENT_ACTIVITY}
            className='text-xs text-primary hover:underline'
          >
            View all
          </Link>
        )}
      </div>

      {canManageAgents ? (
        <>
          {/* Stats row */}
          <div className='grid grid-cols-2 gap-3 px-5 pt-4 sm:grid-cols-4'>
            <StatTile label='Total tasks' value={stats.totalTasks} />
            <StatTile label='Enabled' value={stats.enabledTasks} accent />
            <StatTile
              label='Success rate'
              value={stats.successRate === null ? '—' : `${stats.successRate}%`}
            />
            <StatTile label='Failed runs' value={stats.failedRuns} />
          </div>

          {/* Recent activity feed */}
          <div className='px-5 mt-4'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2'>
              Recent Activity
            </p>
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => {
                return (
                  <div
                    key={item.id}
                    className='flex items-start gap-3 py-3 border-b border-border/50 last:border-0'
                  >
                    <div className='mt-0.5 shrink-0'>
                      {item.success ? (
                        <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                      ) : (
                        <XCircle className='h-4 w-4 text-destructive' />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2 flex-wrap'>
                        <Badge variant='default' className='text-xs font-mono'>
                          {item.tool_name}
                        </Badge>
                        <Badge
                          variant={item.success ? 'success' : 'destructive'}
                          className='text-xs'
                        >
                          {item.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <p className='text-sm text-foreground mt-1 truncate'>
                        {item.description}
                      </p>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {format(parseISO(item.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='py-4 text-sm text-muted-foreground text-center'>
                No activity yet
              </p>
            )}
          </div>

          {/* Footer */}
          <div className='px-5 py-3 border-t border-border mt-2'>
            <Link
              href={ROUTES.DASHBOARD.AGENT_ACTIVITY}
              className='text-xs text-primary hover:underline'
            >
              Open Agent Activity →
            </Link>
          </div>
        </>
      ) : (
        <div className='px-5 py-8 text-center'>
          <Bot className='mx-auto h-8 w-8 text-muted-foreground/40 mb-2' />
          <p className='text-sm text-muted-foreground'>
            Only available to organization managers
          </p>
        </div>
      )}
    </Card>
  );
}
