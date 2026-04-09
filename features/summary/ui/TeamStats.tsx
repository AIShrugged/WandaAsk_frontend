'use client';

import { Building2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

import type {
  TeamStats as TeamStatsType,
  TeamEntry,
} from '@/features/summary/types';

const BAR_COLOR = 'hsl(280 68% 60%)';

// ------------------------------
// Horizontal bar chart for teams
// ------------------------------
interface TeamsChartProps {
  teams: TeamEntry[];
}

/**
 * TeamsChart component. @param props - Component props. @param props.teams
 * @param root0
 * @param root0.teams
 * @returns JSX element.
 */
function TeamsChart({ teams }: TeamsChartProps) {
  if (teams.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No team data
      </p>
    );
  }

  const chartData = teams.map((t) => {
    return {
      name: t.name.length > 18 ? `${t.name.slice(0, 16)}…` : t.name,
      Members: t.members_count,
    };
  });
  const chartHeight = Math.max(200, chartData.length * 36);

  return (
    <ResponsiveContainer width='100%' height={chartHeight}>
      <BarChart
        data={chartData}
        layout='vertical'
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          stroke={CHART_GRID_COLOR}
          horizontal={false}
        />
        <XAxis
          type='number'
          tick={CHART_TICK_STYLE}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type='category'
          dataKey='name'
          tick={CHART_TICK_STYLE}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={CHART_CURSOR_BAR} />
        <Bar dataKey='Members' radius={[0, 3, 3, 0]}>
          {chartData.map((entry) => {
            return <Cell key={entry.name} fill={BAR_COLOR} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------
// Public component (client — recharts)
// ------------------------------
interface TeamStatsProps {
  data: TeamStatsType;
}

/**
 * TeamStats component.
 * Displays total team count and a horizontal bar chart of team sizes.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function TeamStats({ data }: TeamStatsProps) {
  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold text-foreground'>Teams</h2>

      <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
          <Building2 className='h-4 w-4' />
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Total teams</p>
          <p className='text-sm font-semibold text-foreground tabular-nums'>
            {data.total}
          </p>
        </div>
      </div>

      {data.list.length > 0 && (
        <Card className='p-5'>
          <p className='mb-4 text-sm font-medium text-foreground'>Team sizes</p>
          <TeamsChart teams={data.list} />
        </Card>
      )}
    </div>
  );
}
