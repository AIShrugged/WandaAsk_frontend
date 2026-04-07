import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  CalendarClock,
  FileText,
  ExternalLink,
  Link2,
  ListOrdered,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import {
  getCalendarEventDetail,
  getMeetingTasks,
} from '@/features/event/api/calendar-events';
import MeetingTasks from '@/features/meeting/ui/meeting-tasks';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import type {
  CalendarEventAgendaItem,
  CalendarEventParticipant,
  CalendarEventSectionValue,
  CalendarEventTakeaway,
} from '@/features/meetings/model/types';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

function parseDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

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

function sectionTitle(label: string, count: number) {
  return count > 0 ? `${label} (${count})` : label;
}

function formatAgendaType(type?: string | null) {
  if (!type) {
    return null;
  }

  return type === 'personal' ? 'Personal' : formatKey(type);
}

function formatAgendaStatus(status?: string | null) {
  if (!status) {
    return null;
  }

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
  if (!value) {
    return null;
  }

  const date = parseDate(value);

  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatMetaDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatMetaTimeRange(startsAt: Date, endsAt: Date) {
  return `${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(startsAt)} – ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(endsAt)}`;
}

function getDisplayName(participant: CalendarEventParticipant) {
  return (
    participant.name ??
    participant.label ??
    participant.title ??
    participant.email ??
    'Participant'
  );
}

function getParticipantInitials(participant: CalendarEventParticipant) {
  const name = getDisplayName(participant);

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => {
      return part[0] ?? '';
    })
    .join('')
    .toUpperCase();
}

function hasContent(value: CalendarEventSectionValue) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (item == null) return false;
      if (typeof item === 'string') return item.trim().length > 0;
      if (typeof item === 'number' || typeof item === 'boolean') return true;
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === 'object') return Object.keys(item).length > 0;

      return false;
    });
  }

  return Object.values(value).some((entry) => {
    if (entry == null) return false;
    if (typeof entry === 'string') return entry.trim().length > 0;
    if (typeof entry === 'number' || typeof entry === 'boolean') return true;
    if (Array.isArray(entry)) return entry.length > 0;
    if (typeof entry === 'object') return Object.keys(entry).length > 0;

    return false;
  });
}

function renderPrimitive(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);

  return '—';
}

function SectionCard({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className='rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 shadow-card'
    >
      <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
        {Icon && <Icon className='h-3.5 w-3.5' />}
        {title}
      </div>

      <div className='mt-4'>{children}</div>
    </section>
  );
}

function ParticipantChip({
  participant,
}: {
  participant: CalendarEventParticipant;
}) {
  const name = getDisplayName(participant);

  return (
    <div className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5'>
      <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary'>
        {getParticipantInitials(participant)}
      </span>
      <div className='min-w-0'>
        <div className='truncate text-sm font-medium text-foreground'>
          {name}
        </div>
        {(participant.role || participant.title) && (
          <div className='truncate text-xs text-muted-foreground'>
            {participant.role ?? participant.title}
          </div>
        )}
      </div>
      {participant.is_current_user && (
        <Badge variant='primary' className='ml-1'>
          You
        </Badge>
      )}
    </div>
  );
}

function AgendaList({ agendas }: { agendas: CalendarEventAgendaItem[] }) {
  if (agendas.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No agenda items were returned.
      </p>
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

function KeyTakeawayItem({ takeaway }: { takeaway: CalendarEventTakeaway }) {
  const excerpt = takeaway.excerpt.trim();
  const fullText = takeaway.full_text.trim();
  const showFullText = fullText.length > 0 && fullText !== excerpt;

  return (
    <details
      id={takeaway.read_more?.anchor ?? undefined}
      className='group rounded-[var(--radius-card)] border border-border bg-background px-4 py-3'
    >
      <summary className='cursor-pointer list-none'>
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground'>
              <Sparkles className='h-3.5 w-3.5' />
              {takeaway.label ?? formatKey(takeaway.kind)}
            </div>
            <p className='mt-2 text-sm font-medium text-foreground'>
              {takeaway.title}
            </p>
            <p className='mt-1 text-sm leading-6 text-muted-foreground group-open:hidden'>
              {excerpt}
            </p>
          </div>
          <span className='flex-shrink-0 text-xs font-medium text-primary group-open:hidden'>
            Read more
          </span>
        </div>
      </summary>

      {showFullText && (
        <div className='mt-4 border-t border-border/60 pt-4 text-sm leading-6 text-foreground whitespace-pre-line'>
          {fullText}
        </div>
      )}
      {takeaway.read_more?.section && (
        <div className='mt-3 flex flex-wrap gap-2'>
          <Badge variant='default'>Section: {takeaway.read_more.section}</Badge>
          {takeaway.read_more.anchor && (
            <Badge variant='default'>Anchor: {takeaway.read_more.anchor}</Badge>
          )}
        </div>
      )}
    </details>
  );
}

function TakeawaysList({ takeaways }: { takeaways: CalendarEventTakeaway[] }) {
  if (takeaways.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No key takeaways returned.
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {takeaways.map((takeaway, index) => {
        return (
          <KeyTakeawayItem
            key={`${takeaway.kind}-${index}`}
            takeaway={takeaway}
          />
        );
      })}
    </div>
  );
}

function renderValue(value: CalendarEventSectionValue): ReactNode {
  if (!hasContent(value)) {
    return null;
  }

  if (typeof value === 'string') {
    return (
      <p className='text-sm leading-6 text-foreground whitespace-pre-line'>
        {value}
      </p>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <p className='text-sm text-foreground'>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    return (
      <div className='flex flex-col gap-2'>
        {value.map((item, index) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
          ) {
            return (
              <div
                key={index}
                className='rounded-[var(--radius-button)] bg-background px-3 py-2 text-sm text-foreground'
              >
                {String(item)}
              </div>
            );
          }

          if (item && typeof item === 'object') {
            const entries = Object.entries(item as Record<string, unknown>);

            return (
              <div
                key={index}
                className='rounded-[var(--radius-button)] border border-border bg-background px-3 py-2'
              >
                <dl className='grid gap-1 text-sm'>
                  {entries.map(([key, entryValue]) => {
                    return (
                      <div key={key} className='flex gap-3'>
                        <dt className='w-28 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                          {formatKey(key)}
                        </dt>
                        <dd className='min-w-0 text-foreground'>
                          {renderPrimitive(entryValue)}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  const record = value as Record<string, unknown>;
  const titleValue = record.title;
  const excerptValue = record.excerpt;
  const fullTextValue = record.full_text;
  const contentValue = record.content;
  const knownContent =
    titleValue ?? excerptValue ?? fullTextValue ?? contentValue;

  if (knownContent != null) {
    return (
      <div className='flex flex-col gap-3'>
        {titleValue != null && (
          <p className='text-sm font-medium text-foreground'>
            {renderPrimitive(titleValue)}
          </p>
        )}
        {excerptValue != null && (
          <p className='text-sm leading-6 text-muted-foreground'>
            {renderPrimitive(excerptValue)}
          </p>
        )}
        {fullTextValue != null && (
          <p className='text-sm leading-6 text-foreground whitespace-pre-line'>
            {renderPrimitive(fullTextValue)}
          </p>
        )}
        {contentValue != null && fullTextValue == null && (
          <p className='text-sm leading-6 text-foreground whitespace-pre-line'>
            {renderPrimitive(contentValue)}
          </p>
        )}
      </div>
    );
  }

  return (
    <dl className='grid gap-3 sm:grid-cols-2'>
      {Object.entries(record).map(([key, entryValue]) => {
        return (
          <div
            key={key}
            className='rounded-[var(--radius-button)] bg-background px-3 py-2'
          >
            <dt className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              {formatKey(key)}
            </dt>
            <dd className='mt-1 text-sm leading-6 text-foreground'>
              {renderPrimitive(entryValue)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function DetailBlock({
  title,
  icon: Icon,
  value,
  id,
}: {
  title: string;
  icon?: LucideIcon;
  value: CalendarEventSectionValue;
  id?: string;
}) {
  if (!hasContent(value)) {
    return null;
  }

  return (
    <SectionCard title={title} icon={Icon} id={id}>
      {renderValue(value)}
    </SectionCard>
  );
}

function CountsRow({
  counts,
}: {
  counts?: Record<string, number | string | null | undefined> | null;
}) {
  const entries = Object.entries(counts ?? {});

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {entries.map(([key, value]) => {
        return (
          <Badge key={key} variant='default'>
            {formatKey(key)}: {renderPrimitive(value)}
          </Badge>
        );
      })}
    </div>
  );
}

function MeetingPlatformLink({
  platform,
  url,
}: {
  platform: string;
  url?: string | null;
}) {
  if (!url) {
    return <span>{platform}</span>;
  }

  return (
    <a
      href={url}
      target='_blank'
      rel='noreferrer'
      className='inline-flex items-center gap-1 hover:text-primary hover:underline'
    >
      <span>{platform}</span>
      <ExternalLink className='h-3.5 w-3.5' />
    </a>
  );
}

/**
 * MeetingDetail component.
 * @param props - Component props.
 * @param props.id - Calendar event id.
 */
export async function MeetingDetail({ id }: { id: string }) {
  const [{ data }, fallbackTasks] = await Promise.all([
    getCalendarEventDetail(id),
    getMeetingTasks(id),
  ]);
  const event = data.event;
  const url = (event as { url?: string | null }).url;
  const tasks =
    Array.isArray(data.tasks) && data.tasks.length > 0
      ? data.tasks
      : fallbackTasks;
  const startsAt = parseDate(event.starts_at);
  const endsAt = parseDate(event.ends_at);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between gap-4'>
        <Link
          href={ROUTES.DASHBOARD.MEETINGS}
          className='inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Meetings
        </Link>
      </div>

      <section className='flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-card px-5 py-5 shadow-card'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            <FileText className='h-3.5 w-3.5' />
            Meeting detail
          </div>

          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
                {event.title}
              </h1>
              {event.description && (
                <p className='mt-3 max-w-3xl text-sm leading-6 text-muted-foreground'>
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
          {startsAt && endsAt && (
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5'>
              <CalendarClock className='h-4 w-4' />
              {formatMetaDate(startsAt)}
            </span>
          )}
          {startsAt && endsAt && (
            <span className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5'>
              <Clock3 className='h-4 w-4' />
              {formatMetaTimeRange(startsAt, endsAt)}
            </span>
          )}
          <span className='inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5'>
            <Link2 className='h-4 w-4' />
            <MeetingPlatformLink platform={event.platform} url={url} />
          </span>
        </div>

        <CountsRow counts={data.counts} />
      </section>

      <div className='grid gap-5'>
        <SectionCard
          title={sectionTitle('Agenda', data.agendas.length)}
          icon={ListOrdered}
        >
          <AgendaList agendas={data.agendas} />
        </SectionCard>

        <SectionCard
          title={sectionTitle('Participants', data.participants.length)}
          icon={Users}
        >
          {data.participants.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No participants returned.
            </p>
          ) : (
            <div className='flex flex-wrap gap-3'>
              {data.participants.map((participant, index) => {
                return (
                  <ParticipantChip
                    key={String(
                      participant.id ??
                        `${index}-${getDisplayName(participant)}`,
                    )}
                    participant={participant}
                  />
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={sectionTitle('Tasks', tasks.length)}
          icon={CheckCircle2}
        >
          <MeetingTasks tasks={tasks} />
        </SectionCard>

        <SectionCard
          title={sectionTitle('Key takeaways', data.key_takeaways.length)}
          icon={Sparkles}
        >
          <TakeawaysList takeaways={data.key_takeaways} />
        </SectionCard>

        <DetailBlock title='Summary' icon={BookOpen} value={data.summary} />
        <DetailBlock
          title='Review / Insights'
          icon={FileText}
          value={data.review}
        />
        <DetailBlock
          title='Follow-up'
          icon={CheckCircle2}
          value={data.followup}
        />

        <DetailBlock
          title='Connected meeting'
          icon={ArrowLeft}
          value={data.previous_meeting}
        />
      </div>
    </div>
  );
}
