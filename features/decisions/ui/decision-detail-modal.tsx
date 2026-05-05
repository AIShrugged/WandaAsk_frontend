'use client';

import { Calendar } from 'lucide-react';
import { type PropsWithChildren } from 'react';

import { DecisionSourceBadge } from '@/features/decisions/ui/decision-source-badge';
import { Modal } from '@/shared/ui/modal/modal';

import type { Decision } from '@/features/decisions/model/types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DecisionDetailModal({
  decision,
  onClose,
}: {
  decision: Decision | null;
  onClose: () => void;
}) {
  if (!decision) return null;

  const dateIso = decision.calendar_event?.starts_at ?? decision.created_at;

  return (
    <Modal isOpen={true} onClose={onClose} title='Decision details'>
      <div className='flex flex-col gap-5 p-4'>
        <Section label='Decision'>
          <p className='text-sm text-foreground leading-relaxed whitespace-pre-wrap'>
            {decision.text}
          </p>
        </Section>

        {decision.topic && (
          <Section label='Topic'>
            <p className='text-xs font-semibold text-primary/80 uppercase tracking-wide'>
              {decision.topic}
            </p>
          </Section>
        )}

        <Section label='Event'>
          {decision.calendar_event ? (
            <span className='inline-flex items-center gap-1.5 text-sm text-muted-foreground'>
              <Calendar className='w-4 h-4 shrink-0' />
              {decision.calendar_event.title}
            </span>
          ) : (
            <span className='text-sm text-muted-foreground/50'>—</span>
          )}
        </Section>

        <Section label='Date'>
          <span className='text-sm text-muted-foreground'>
            {formatDate(dateIso)}
          </span>
        </Section>

        <Section label='Source'>
          <DecisionSourceBadge sourceType={decision.source_type} />
        </Section>

        <Section label='Linked issues'>
          {decision.issues && decision.issues.length > 0 ? (
            <ul className='flex flex-col gap-1'>
              {decision.issues.map((issue) => {
                return (
                  <li key={issue.id} className='text-sm text-foreground'>
                    {issue.name}
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className='text-sm text-muted-foreground/50'>None</span>
          )}
        </Section>
      </div>
    </Modal>
  );
}

function Section({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {label}
      </span>
      {children}
    </div>
  );
}
