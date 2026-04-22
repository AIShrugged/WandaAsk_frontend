import { ListOrdered } from 'lucide-react';

import { getCalendarEventDetail } from '@/features/event';
import { Badge } from '@/shared/ui/badge';

import type { CalendarEventAgendaItem } from '@/features/meetings';

function formatKey(key: string) {
  return key
    .replaceAll('_', ' ')
    .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => {
      return char.toUpperCase();
    });
}

function formatAgendaType(type?: string | null) {
  if (!type) return null;

  return type === 'personal' ? 'Personal' : formatKey(type);
}

function formatAgendaStatus(status?: string | null) {
  if (!status) return null;

  switch (status) {
    case 'done': {
      return 'Ready';
    }
    case 'in_progress': {
      return 'Preparing';
    }
    case 'failed': {
      return 'Failed';
    }
    case 'pending': {
      return 'Pending';
    }
    default: {
      return formatKey(status);
    }
  }
}

function formatAgendaDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function AgendaList({ agendas }: { agendas: CalendarEventAgendaItem[] }) {
  if (agendas.length === 0) {
    return (
      <div className='flex flex-col items-center gap-3 py-16 text-center'>
        <ListOrdered
          className='h-8 w-8 text-muted-foreground/40'
          aria-hidden='true'
        />
        <p className='text-sm text-muted-foreground'>No agenda items yet.</p>
      </div>
    );
  }

  return (
    <ol className='flex flex-col gap-0'>
      {agendas.map((agenda, index) => {
        const content =
          agenda.content ??
          agenda.title ??
          agenda.text ??
          agenda.description ??
          'Agenda item';
        const summaryText =
          agenda.title ?? agenda.text ?? agenda.description ?? null;
        const typeLabel = formatAgendaType(agenda.type);
        const statusLabel = formatAgendaStatus(agenda.status);
        const sentAtLabel = formatAgendaDate(agenda.sent_at);
        const scheduledAtLabel = formatAgendaDate(agenda.send_scheduled_at);

        return (
          <li
            key={String(agenda.id ?? `${index}-${content}`)}
            className='flex gap-4 border-t border-border/60 py-4 first:border-t-0 first:pt-0 last:pb-0'
          >
            <span className='mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-muted-foreground'>
              {agenda.order ?? index + 1}
            </span>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                {typeLabel && <Badge variant='default'>{typeLabel}</Badge>}
                {statusLabel && <Badge variant='primary'>{statusLabel}</Badge>}
                {(sentAtLabel || scheduledAtLabel) && (
                  <span className='text-xs text-muted-foreground'>
                    {sentAtLabel && `Sent ${sentAtLabel}`}
                    {sentAtLabel && scheduledAtLabel && ' • '}
                    {scheduledAtLabel && `Scheduled ${scheduledAtLabel}`}
                  </span>
                )}
              </div>
              <p className='mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground'>
                {content}
              </p>
              {summaryText != null && summaryText !== content && (
                <p className='mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground'>
                  {summaryText}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Meeting agenda/protocol tab — shows agenda items.
 * Label in the tab nav is "Protocol" for completed meetings, "Agenda" otherwise.
 */
export default async function MeetingAgendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await getCalendarEventDetail(id);
  const hasProtocol = data.event.has_summary;

  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <section className='rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 shadow-card'>
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          <ListOrdered className='h-3.5 w-3.5' />
          {hasProtocol ? 'Protocol' : 'Agenda'} ({data.agendas.length})
        </div>
        <div className='mt-4'>
          <AgendaList agendas={data.agendas} />
        </div>
      </section>
    </div>
  );
}
