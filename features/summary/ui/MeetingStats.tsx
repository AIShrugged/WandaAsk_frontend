'use client';

import { format, parseISO } from 'date-fns';
import { Bot, Clock, Calendar } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Card from '@/shared/ui/card/Card';

import type {
  MeetingStats as MeetingStatsType,
  MeetingMonthStat,
  RecentMeeting,
} from '@/features/summary/types';

// ------------------------------
// Chart tooltip style (shared constant)
// ------------------------------
const TOOLTIP_STYLE = {
  background: 'hsl(0 0% 100%)',
  border: '1px solid hsl(240 5.9% 90%)',
  borderRadius: '6px',
  fontSize: 12,
} as const;

const TICK_STYLE = { fontSize: 11, fill: 'hsl(240 3.8% 46.1%)' } as const;

const GRID_COLOR = 'hsl(240 5.9% 90%)';

const BAR_COLOR = 'hsl(142 47% 45%)';

// ------------------------------
// Sub-stat card
// ------------------------------
interface SubStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

/**
 * SubStat component. @param props - Component props. @param props.label @param props.value @param props.icon
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.icon
 * @returns JSX element.
 */
function SubStat({ label, value, icon }: SubStatProps) {
  return (
    <div className='flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3'>
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
        {icon}
      </div>
      <div>
        <p className='text-xs text-muted-foreground'>{label}</p>
        <p className='text-sm font-semibold text-foreground'>{value}</p>
      </div>
    </div>
  );
}

// ------------------------------
// Monthly BarChart
// ------------------------------
interface MonthlyChartProps {
  data: MeetingMonthStat[];
}

/**
 * MeetingMonthlyChart component. @param props - Component props. @param props.data
 * @param root0
 * @param root0.data
 * @returns JSX element.
 */
function MeetingMonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((item) => {
    return {
      label: format(parseISO(`${item.month}-01`), 'MMM'),
      Meetings: item.count,
    };
  });

  return (
    <ResponsiveContainer width='100%' height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        barGap={2}
      >
        <CartesianGrid strokeDasharray='3 3' stroke={GRID_COLOR} />
        <XAxis
          dataKey='label'
          tick={TICK_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={TICK_STYLE}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey='Meetings' fill={BAR_COLOR} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------
// Recent meetings table
// ------------------------------
interface RecentMeetingsProps {
  meetings: RecentMeeting[];
}

/**
 * RecentMeetingsTable component. @param props - Component props. @param props.meetings
 * @param root0
 * @param root0.meetings
 * @returns JSX element.
 */
function RecentMeetingsTable({ meetings }: RecentMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        No meeting data
      </p>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-border'>
            <th className='pb-2 pr-4 text-left text-xs font-medium text-muted-foreground'>
              Title
            </th>
            <th className='pb-2 pr-4 text-left text-xs font-medium text-muted-foreground'>
              Date
            </th>
            <th className='pb-2 pr-4 text-right text-xs font-medium text-muted-foreground'>
              Duration
            </th>
            <th className='pb-2 text-right text-xs font-medium text-muted-foreground'>
              Participants
            </th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => {
            return (
              <tr
                key={meeting.id}
                className='border-b border-border/50 last:border-0'
              >
                <td className='py-2 pr-4 font-medium text-foreground max-w-[200px] truncate'>
                  {meeting.title}
                </td>
                <td className='py-2 pr-4 text-muted-foreground'>
                  {format(parseISO(meeting.starts_at), 'MMM d, yyyy')}
                </td>
                <td className='py-2 pr-4 text-right text-muted-foreground tabular-nums'>
                  {meeting.duration_minutes} min
                </td>
                <td className='py-2 text-right text-muted-foreground tabular-nums'>
                  {meeting.participants_count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------
// Public component (client — recharts)
// ------------------------------
interface MeetingStatsProps {
  data: MeetingStatsType;
}

/**
 * MeetingStats component.
 * Displays meeting statistics including sub-stats, monthly bar chart,
 * and the last 10 meetings table.
 * @param props - Component props.
 * @param props.data
 * @returns JSX element.
 */
export function MeetingStats({ data }: MeetingStatsProps) {
  const totalHours = Math.round(data.total_duration_minutes / 60);

  return (
    <div className='flex flex-col gap-4'>
      <h2 className='text-lg font-semibold text-foreground'>Meetings</h2>

      {/* Sub-stats row */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <SubStat
          label='With bot'
          value={String(data.with_bot)}
          icon={<Bot className='h-4 w-4' />}
        />
        <SubStat
          label='Avg. duration'
          value={`${data.average_duration_minutes} min`}
          icon={<Clock className='h-4 w-4' />}
        />
        <SubStat
          label='Total time'
          value={`${totalHours} h`}
          icon={<Calendar className='h-4 w-4' />}
        />
      </div>

      {/* Monthly chart */}
      {data.by_month.length > 0 && (
        <Card className='p-5'>
          <p className='mb-4 text-sm font-medium text-foreground'>
            Meetings by month
          </p>
          <MeetingMonthlyChart data={data.by_month} />
        </Card>
      )}

      {/* Recent meetings */}
      <Card className='p-5'>
        <p className='mb-4 text-sm font-medium text-foreground'>
          Recent meetings
        </p>
        <RecentMeetingsTable meetings={data.recent} />
      </Card>
    </div>
  );
}
