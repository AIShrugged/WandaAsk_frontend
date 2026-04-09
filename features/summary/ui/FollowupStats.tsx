'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import { CHART_TOOLTIP_STYLE } from '@/shared/lib/chart-theme';
import Card from '@/shared/ui/card/Card';

import type { FollowupStats as FollowupStatsType } from '@/features/summary/types';

const STATUS_COLORS: Record<string, string> = {
  Done: 'hsl(142 47% 45%)',
  'In Progress': 'hsl(45 93% 58%)',
  Failed: 'hsl(0 84% 60%)',
};

// ------------------------------
// Donut chart
// ------------------------------
interface FollowupDonutChartProps {
  done: number;
  in_progress: number;
  failed: number;
}

/**
 * FollowupDonutChart component. @param props - Component props. @param props.done @param props.in_progress @param props.failed
 * @param root0
 * @param root0.done
 * @param root0.in_progress
 * @param root0.failed
 * @returns JSX element.
 */
function FollowupDonutChart({
  done,
  in_progress,
  failed,
}: FollowupDonutChartProps) {
  const chartData = [
    { name: 'Done', value: done },
    { name: 'In Progress', value: in_progress },
    { name: 'Failed', value: failed },
  ].filter((entry) => {
    return entry.value > 0;
  });

  if (chartData.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No follow-up data
      </p>
    );
  }

  return (
    <ResponsiveContainer width='100%' height={220}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey='value'
          nameKey='name'
          cx='50%'
          cy='50%'
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {chartData.map((entry) => {
            return (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? 'hsl(240 3.8% 65%)'}
              />
            );
          })}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ------------------------------
// Public component (client — recharts)
// ------------------------------
interface FollowupStatsProps {
  data: FollowupStatsType;
}

/**
 * FollowupStats component.
 * Renders follow-up totals and a status donut chart.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function FollowupStats({ data }: FollowupStatsProps) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>Follow-up</h2>
        <span className='text-3xl font-bold text-primary tabular-nums'>
          {data.total}
        </span>
      </div>

      <Card className='p-5'>
        <FollowupDonutChart
          done={data.by_status.done}
          in_progress={data.by_status.in_progress}
          failed={data.by_status.failed}
        />
      </Card>
    </div>
  );
}
