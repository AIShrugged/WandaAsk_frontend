import { ClipboardList } from 'lucide-react';

import { AgendaDonutLoader } from '@/features/main-dashboard/ui/agenda-donut-loader';
import { AgendaItem } from '@/features/main-dashboard/ui/agenda-item';
import Card from '@/shared/ui/card/Card';

import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';

const MAX_ROWS = 5;

interface StatTileProps {
  label: string;
  value: number;
  accent?: boolean;
}

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

interface UpcomingAgendasBlockProps {
  agendas: MeetingAgenda[];
}

/**
 * UpcomingAgendasBlock — shows upcoming meeting agendas with status breakdown.
 * @param root0
 * @param root0.agendas
 */
export function UpcomingAgendasBlock({ agendas }: UpcomingAgendasBlockProps) {
  const readyCount = agendas.filter((a) => {
    return a.status === 'done';
  }).length;
  const preparingCount = agendas.filter((a) => {
    return a.status === 'pending' || a.status === 'in_progress';
  }).length;
  const failedCount = agendas.filter((a) => {
    return a.status === 'failed';
  }).length;
  const visibleAgendas = agendas.slice(0, MAX_ROWS);

  return (
    <Card className='flex flex-col gap-0'>
      {/* Header */}
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <ClipboardList className='h-4 w-4 text-primary' />
          <h2 className='text-base font-semibold text-foreground'>
            Upcoming Agendas
          </h2>
          {agendas.length > 0 && (
            <span className='text-xs text-muted-foreground'>
              ({agendas.length})
            </span>
          )}
        </div>
      </div>

      {agendas.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 px-5 py-10 text-center'>
          <ClipboardList className='h-8 w-8 text-muted-foreground/40' />
          <p className='text-sm font-medium text-muted-foreground'>
            No upcoming agendas
          </p>
          <p className='text-xs text-muted-foreground/70'>
            Agendas are generated 30 min before each meeting
          </p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className='grid grid-cols-2 gap-3 px-5 pt-4 sm:grid-cols-4'>
            <StatTile label='Total' value={agendas.length} />
            <StatTile label='Ready' value={readyCount} accent />
            <StatTile label='Preparing' value={preparingCount} />
            <StatTile label='Failed' value={failedCount} />
          </div>

          {/* Donut chart */}
          <div className='px-5 pt-4'>
            <AgendaDonutLoader agendas={agendas} />
          </div>

          {/* Agenda rows */}
          <div className='px-5 mt-2 pb-2'>
            <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2'>
              Next meetings
            </p>
            {visibleAgendas.map((agenda) => {
              return <AgendaItem key={agenda.id} agenda={agenda} />;
            })}
          </div>
        </>
      )}
    </Card>
  );
}
