import { Calendar } from 'lucide-react';

import { DecisionSourceBadge } from '@/features/decisions/ui/decision-source-badge';

import type { Decision } from '@/features/decisions/model/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  decisions: Decision[];
}

export function DecisionsTable({ decisions }: Props) {
  return (
    <div className='overflow-x-auto rounded-[var(--radius-card)] border border-border'>
      <table className='w-full text-sm border-collapse'>
        <thead>
          <tr className='border-b border-border bg-muted/20'>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Key Point
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Decision
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Event
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Date
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((decision) => {
            const dateIso =
              decision.calendar_event?.starts_at ?? decision.created_at;

            return (
              <tr
                key={decision.id}
                className='border-b border-border/50 hover:bg-muted/30 transition-colors last:border-b-0'
              >
                <td className='px-4 py-3 align-top'>
                  {decision.topic ? (
                    <span className='text-xs font-semibold text-primary/80 uppercase tracking-wide'>
                      {decision.topic}
                    </span>
                  ) : (
                    <span className='text-muted-foreground/40'>—</span>
                  )}
                </td>

                <td className='px-4 py-3 align-top max-w-xs'>
                  <p className='text-foreground leading-relaxed line-clamp-2'>
                    {decision.text}
                  </p>
                </td>

                <td className='px-4 py-3 align-top'>
                  {decision.calendar_event ? (
                    <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
                      <Calendar className='w-3.5 h-3.5 shrink-0' />
                      <span className='truncate max-w-[160px]'>
                        {decision.calendar_event.title}
                      </span>
                    </span>
                  ) : (
                    <span className='text-muted-foreground/40'>—</span>
                  )}
                </td>

                <td className='px-4 py-3 align-top whitespace-nowrap text-muted-foreground'>
                  {formatDate(dateIso)}
                </td>

                <td className='px-4 py-3 align-top'>
                  <DecisionSourceBadge sourceType={decision.source_type} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
