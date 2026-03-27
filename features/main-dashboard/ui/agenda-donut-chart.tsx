'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { CHART_TOOLTIP_STYLE } from '@/shared/lib/chart-theme';

import type {
  AgendaStatus,
  MeetingAgenda,
} from '@/features/main-dashboard/model/agenda-types';

const STATUS_COLORS: Record<AgendaStatus, string> = {
  done: 'hsl(142 47% 45%)',
  in_progress: 'hsl(45 93% 58%)',
  pending: 'hsl(240 3.8% 65%)',
  failed: 'hsl(0 84% 60%)',
};

const STATUS_LABELS: Record<AgendaStatus, string> = {
  done: 'Ready',
  in_progress: 'Preparing',
  pending: 'Pending',
  failed: 'Failed',
};

interface AgendaDonutChartProps {
  agendas: MeetingAgenda[];
}

/**
 * AgendaDonutChart — pie/donut chart showing agenda status breakdown.
 * @param root0
 * @param root0.agendas
 */
export function AgendaDonutChart({ agendas }: AgendaDonutChartProps) {
  const counts: Record<AgendaStatus, number> = {
    done: 0,
    in_progress: 0,
    pending: 0,
    failed: 0,
  };

  for (const agenda of agendas) {
    counts[agenda.status]++;
  }

  const data = (Object.keys(counts) as AgendaStatus[])
    .filter((status) => {
      return counts[status] > 0;
    })
    .map((status) => {
      return {
        name: STATUS_LABELS[status],
        value: counts[status],
        status,
      };
    });

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width='100%' height={160}>
      <PieChart>
        <Pie
          data={data}
          dataKey='value'
          nameKey='name'
          cx='50%'
          cy='50%'
          innerRadius={35}
          outerRadius={55}
          paddingAngle={2}
        >
          {data.map((entry) => {
            return (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
            );
          })}
        </Pie>
        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
