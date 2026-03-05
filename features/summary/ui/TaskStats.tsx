'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import Card from '@/shared/ui/card/Card';

import type { TaskStats as TaskStatsType } from '@/features/summary/types';

// ------------------------------
// Constants
// ------------------------------
const TOOLTIP_STYLE = {
  background: 'hsl(0 0% 100%)',
  border: '1px solid hsl(240 5.9% 90%)',
  borderRadius: '6px',
  fontSize: 12,
} as const;

const STATUS_COLORS: Record<string, string> = {
  Open: 'hsl(217 91% 60%)',
  'In Progress': 'hsl(45 93% 58%)',
  Done: 'hsl(142 47% 45%)',
  Cancelled: 'hsl(240 3.8% 65%)',
};

// ------------------------------
// Donut chart
// ------------------------------
interface TaskDonutChartProps {
  open: number;
  in_progress: number;
  done: number;
  cancelled: number;
}

/**
 * TaskDonutChart component. @param props - Component props. @param props.open @param props.in_progress @param props.done @param props.cancelled
 * @param root0
 * @param root0.open
 * @param root0.in_progress
 * @param root0.done
 * @param root0.cancelled
 * @returns JSX element.
 */
function TaskDonutChart({
  open,
  in_progress,
  done,
  cancelled,
}: TaskDonutChartProps) {
  const chartData = [
    { name: 'Open', value: open },
    { name: 'In Progress', value: in_progress },
    { name: 'Done', value: done },
    { name: 'Cancelled', value: cancelled },
  ].filter((entry) => {
    return entry.value > 0;
  });

  if (chartData.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No task data
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ------------------------------
// Public component (client — recharts)
// ------------------------------
interface TaskStatsProps {
  data: TaskStatsType;
}

/**
 * TaskStats component.
 * Renders task totals, a status donut chart, and an overdue badge.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function TaskStats({ data }: TaskStatsProps) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>Tasks</h2>
        <span className='text-3xl font-bold text-primary tabular-nums'>
          {data.total}
        </span>
      </div>

      <Card className='p-5'>
        <TaskDonutChart
          open={data.by_status.open}
          in_progress={data.by_status.in_progress}
          done={data.by_status.done}
          cancelled={data.by_status.cancelled}
        />
      </Card>

      {data.overdue > 0 && (
        <div className='flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3'>
          <AlertTriangle className='h-4 w-4 shrink-0 text-destructive' />
          <p className='text-sm font-medium text-destructive'>
            Overdue tasks: {data.overdue}
          </p>
        </div>
      )}
    </div>
  );
}
