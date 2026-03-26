'use client';

import { Users } from 'lucide-react';
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
  ParticipantStats as ParticipantStatsType,
  TopParticipant,
} from '@/features/summary/types';

const BAR_COLOR = 'hsl(217 91% 60%)';

// ------------------------------
// Horizontal bar chart for top participants
// ------------------------------
interface TopParticipantsChartProps {
  participants: TopParticipant[];
}

/**
 * TopParticipantsChart component. @param props - Component props. @param props.participants
 * @param root0
 * @param root0.participants
 * @returns JSX element.
 */
function TopParticipantsChart({ participants }: TopParticipantsChartProps) {
  if (participants.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No participant data
      </p>
    );
  }

  const chartData = participants.map((p) => {
    return {
      name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
      Meetings: p.meetings_count,
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
        <Bar dataKey='Meetings' radius={[0, 3, 3, 0]}>
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
interface ParticipantStatsProps {
  data: ParticipantStatsType;
}

/**
 * ParticipantStats component.
 * Shows unique participant count, average per meeting,
 * and a horizontal bar chart of the top 10 participants.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function ParticipantStats({ data }: ParticipantStatsProps) {
  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold text-foreground'>Participants</h2>

      <div className='grid grid-cols-2 gap-3'>
        <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
            <Users className='h-4 w-4' />
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Unique</p>
            <p className='text-sm font-semibold text-foreground tabular-nums'>
              {data.total_unique}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3'>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
            <Users className='h-4 w-4' />
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Avg. per meeting</p>
            <p className='text-sm font-semibold text-foreground tabular-nums'>
              {data.average_per_meeting.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <Card className='p-5'>
        <p className='mb-4 text-sm font-medium text-foreground'>
          Top participants
        </p>
        <TopParticipantsChart participants={data.top} />
      </Card>
    </div>
  );
}
