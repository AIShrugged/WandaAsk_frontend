import { FileText, MicOff } from 'lucide-react';

import { getMeetingTranscript } from '@/features/meetings/api/meetings';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Meeting transcript tab — shows timestamped speech segments.
 */
export default async function MeetingTranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entries = await getMeetingTranscript(id);

  if (!entries || entries.length === 0) {
    return (
      <div className='mx-auto w-full max-w-4xl px-6 py-6'>
        <div className='flex flex-col items-center gap-4 py-20 text-center'>
          <MicOff className='h-10 w-10 text-muted-foreground/40' />
          <div>
            <p className='text-sm font-medium text-foreground'>
              Transcript not available
            </p>
            <p className='mt-1 text-xs text-muted-foreground'>
              No transcript has been recorded for this meeting yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <section className='rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 shadow-card'>
        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          <FileText className='h-3.5 w-3.5' />
          Transcript ({entries.length} segments)
        </div>

        <div className='mt-4 flex flex-col gap-0'>
          {entries.map((entry, index) => {
            const speakerName =
              entry.participant.name ?? entry.participant.email ?? 'Unknown';
            const isNewSpeaker =
              index === 0 ||
              entries[index - 1]?.participant.id !== entry.participant.id;

            return (
              <div
                key={entry.id}
                className={`flex gap-4 py-3 ${index > 0 ? 'border-t border-border/40' : ''}`}
              >
                <div className='w-12 flex-shrink-0 pt-0.5 text-right text-xs tabular-nums text-muted-foreground/60'>
                  {formatTime(entry.start_relative)}
                </div>
                <div className='min-w-0 flex-1'>
                  {isNewSpeaker && (
                    <p className='mb-1 text-xs font-semibold text-primary'>
                      {speakerName}
                    </p>
                  )}
                  <p className='text-sm leading-6 text-foreground'>
                    {entry.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
