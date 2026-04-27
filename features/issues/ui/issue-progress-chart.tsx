'use client';

import { format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

import type { IssueHistoryPeriod, IssueStatsHistory } from '../model/types';
import type React from 'react';

const PERIODS: { value: IssueHistoryPeriod; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const BAR_COLOR = 'hsl(262 83% 65%)';
const BAR_COLOR_PARTIAL = 'hsl(262 83% 65% / 0.45)';

function formatXLabel(date: string, period: IssueHistoryPeriod): string {
  const d = parseISO(date);
  if (period === 'day') return format(d, 'MMM d');
  if (period === 'week') return `W${format(d, 'w')}`;
  return format(d, 'MMM');
}

function formatTooltipLabel(date: string, period: IssueHistoryPeriod): string {
  const d = parseISO(date);
  if (period === 'day') return format(d, 'EEE, MMM d');
  if (period === 'week') return `Week of ${format(d, 'MMM d')}`;
  return format(d, 'MMMM yyyy');
}

function isCurrentPeriod(date: string, period: IssueHistoryPeriod): boolean {
  const now = new Date();
  if (period === 'day') return date === format(now, 'yyyy-MM-dd');
  if (period === 'week') {
    return date === format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }
  return date === format(startOfMonth(now), 'yyyy-MM-dd');
}

interface TooltipEntry {
  payload: { date: string };
}

type TooltipFormatterFn = NonNullable<
  React.ComponentProps<typeof Tooltip>['formatter']
>;

export function IssueProgressChart({
  history,
  period,
}: {
  history: IssueStatsHistory;
  period: IssueHistoryPeriod;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPeriod = (next: IssueHistoryPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium text-muted-foreground'>
          Completed tasks over time
        </h3>
        <div
          role='group'
          aria-label='Select period'
          className='flex gap-1 rounded-md bg-muted p-1'
        >
          {PERIODS.map(({ value, label }) => {
            return (
              <button
                key={value}
                type='button'
                onClick={() => {
                  return setPeriod(value);
                }}
                aria-pressed={period === value}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  period === value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div role='img' aria-label={`Bar chart: completed tasks by ${period}`}>
        <ResponsiveContainer width='100%' height={240}>
          <BarChart
            key={period}
            data={history.items}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              stroke={CHART_GRID_COLOR}
              vertical={false}
            />
            <XAxis
              dataKey='date'
              tickFormatter={(d: string) => {
                return formatXLabel(d, period);
              }}
              tick={CHART_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={CHART_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              cursor={CHART_CURSOR_BAR}
              labelFormatter={(d) => {
                return formatTooltipLabel(d as string, period);
              }}
              formatter={
                ((value: number, _name: unknown, entry: TooltipEntry) => {
                  return [
                    value,
                    isCurrentPeriod(entry.payload.date, period)
                      ? 'Completed (partial period)'
                      : 'Completed',
                  ];
                }) as TooltipFormatterFn
              }
            />
            <Bar dataKey='closed' radius={[3, 3, 0, 0]} minPointSize={2}>
              {history.items.map((entry, index) => {
                return (
                  <Cell
                    key={index}
                    fill={
                      isCurrentPeriod(entry.date, period)
                        ? BAR_COLOR_PARTIAL
                        : BAR_COLOR
                    }
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
