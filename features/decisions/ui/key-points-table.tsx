import { Calendar } from 'lucide-react';

import type { MeetingKeyPoint } from '@/features/decisions/model/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  keyPoints: MeetingKeyPoint[];
}

export function KeyPointsTable({ keyPoints }: Props) {
  return (
    <div className='overflow-x-auto rounded-[var(--radius-card)] border border-border'>
      <table className='w-full text-sm border-collapse'>
        <thead>
          <tr className='border-b border-border bg-muted/20'>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              #
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Key Point
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Event
            </th>
            <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {keyPoints.map((kp) => {
            const dateIso = kp.calendar_event?.starts_at ?? kp.created_at;

            return (
              <tr
                key={kp.id}
                className='border-b border-border/50 hover:bg-muted/30 transition-colors last:border-b-0'
              >
                <td className='px-4 py-3 align-top text-muted-foreground/60 text-xs tabular-nums w-8'>
                  {kp.position + 1}
                </td>

                <td className='px-4 py-3 align-top max-w-sm'>
                  <p className='text-foreground leading-relaxed line-clamp-2'>
                    {kp.text}
                  </p>
                </td>

                <td className='px-4 py-3 align-top'>
                  {kp.calendar_event ? (
                    <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
                      <Calendar className='w-3.5 h-3.5 shrink-0' />
                      <span className='truncate max-w-[160px]'>
                        {kp.calendar_event.title}
                      </span>
                    </span>
                  ) : (
                    <span className='text-muted-foreground/40'>—</span>
                  )}
                </td>

                <td className='px-4 py-3 align-top whitespace-nowrap text-muted-foreground'>
                  {formatDate(dateIso)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
