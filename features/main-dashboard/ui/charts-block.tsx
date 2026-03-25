'use client';

import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CHART_CURSOR_BAR,
  CHART_GRID_COLOR,
  CHART_TICK_STYLE,
  CHART_TOOLTIP_STYLE,
} from '@/shared/lib/chart-theme';
import Card from '@/shared/ui/card/Card';

import type { DashboardApiResponse } from '@/features/summary/types';

const BAR_COLOR = 'hsl(142 47% 45%)';

const TASK_COLORS: Record<string, string> = {
  Open: 'hsl(217 91% 60%)',
  'In Progress': 'hsl(45 93% 58%)',
  Done: 'hsl(142 47% 45%)',
  Cancelled: 'hsl(240 3.8% 65%)',
};

const FOLLOWUP_COLORS: Record<string, string> = {
  Done: 'hsl(142 47% 45%)',
  'In Progress': 'hsl(45 93% 58%)',
  Failed: 'hsl(0 84% 60%)',
};

interface ChartsBlockProps {
  summary: DashboardApiResponse;
}

/**
 * ChartsBlock — meeting trend bar chart + task/followup donut charts.
 * @param root0
 * @param root0.summary
 */
export function ChartsBlock({ summary }: ChartsBlockProps) {
  const monthlyData = summary.meetings.by_month.map((item) => {
    return {
      label: format(parseISO(`${item.month}-01`), 'MMM'),
      Meetings: item.count,
    };
  });

  const taskData = [
    { name: 'Open', value: summary.tasks.by_status.open },
    { name: 'In Progress', value: summary.tasks.by_status.in_progress },
    { name: 'Done', value: summary.tasks.by_status.done },
    { name: 'Cancelled', value: summary.tasks.by_status.cancelled },
  ].filter((e) => {
    return e.value > 0;
  });

  const followupData = [
    { name: 'Done', value: summary.followups.by_status.done },
    { name: 'In Progress', value: summary.followups.by_status.in_progress },
    { name: 'Failed', value: summary.followups.by_status.failed },
  ].filter((e) => {
    return e.value > 0;
  });

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
      {/* Monthly trend */}
      {monthlyData.length > 0 && (
        <Card className='p-5 lg:col-span-2'>
          <p className='mb-4 text-sm font-semibold text-foreground'>
            Meeting activity by month
          </p>
          <ResponsiveContainer width='100%' height={200}>
            <BarChart
              data={monthlyData}
              margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke={CHART_GRID_COLOR} />
              <XAxis
                dataKey='label'
                tick={CHART_TICK_STYLE}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={CHART_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                cursor={CHART_CURSOR_BAR}
              />
              <Bar dataKey='Meetings' fill={BAR_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Tasks + followups donuts */}
      <Card className='p-5 flex flex-col gap-4'>
        <div>
          <p className='mb-2 text-sm font-semibold text-foreground'>Tasks</p>
          {taskData.length === 0 ? (
            <p className='text-xs text-muted-foreground text-center py-4'>
              No task data
            </p>
          ) : (
            <ResponsiveContainer width='100%' height={140}>
              <PieChart>
                <Pie
                  data={taskData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                >
                  {taskData.map((entry) => {
                    return (
                      <Cell
                        key={entry.name}
                        fill={TASK_COLORS[entry.name] ?? 'hsl(240 3.8% 65%)'}
                      />
                    );
                  })}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {summary.tasks.overdue > 0 && (
            <div className='flex items-center gap-1.5 mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2'>
              <AlertTriangle className='h-3.5 w-3.5 shrink-0 text-destructive' />
              <p className='text-xs font-medium text-destructive'>
                {summary.tasks.overdue} overdue
              </p>
            </div>
          )}
        </div>

        <div className='border-t border-border pt-4'>
          <p className='mb-2 text-sm font-semibold text-foreground'>
            Follow-ups
          </p>
          {followupData.length === 0 ? (
            <p className='text-xs text-muted-foreground text-center py-4'>
              No follow-up data
            </p>
          ) : (
            <ResponsiveContainer width='100%' height={140}>
              <PieChart>
                <Pie
                  data={followupData}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                >
                  {followupData.map((entry) => {
                    return (
                      <Cell
                        key={entry.name}
                        fill={
                          FOLLOWUP_COLORS[entry.name] ?? 'hsl(240 3.8% 65%)'
                        }
                      />
                    );
                  })}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
