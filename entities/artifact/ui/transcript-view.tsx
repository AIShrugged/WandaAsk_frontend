import type { TranscriptArtifact } from '@/entities/artifact/model/types';

const SPEAKER_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-orange-500',
];

/**
 * speakerColor.
 * @param name - name.
 * @returns Result.
 */
function speakerColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.codePointAt(i)!) % SPEAKER_COLORS.length;
  }

  return SPEAKER_COLORS[hash];
}

/**
 * initials.
 * @param name - name.
 * @returns Result.
 */
function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => {
      return w[0];
    })
    .join('')
    .toUpperCase();
}

/**
 * TranscriptView component.
 * @param props - Component props.
 * @param props.data - Transcript artifact data.
 * @returns Result.
 */
export function TranscriptView({ data }: { data: TranscriptArtifact['data'] }) {
  const entries = data.entries ?? [];

  if (entries.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>
        No transcript
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-hide'>
      {entries.map((entry, i) => {
        return (
          <div key={i} className='flex items-start gap-2.5'>
            <div
              className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5 ${speakerColor(entry.speaker)}`}
            >
              {initials(entry.speaker)}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-baseline gap-2 mb-0.5'>
                <span className='text-xs font-semibold text-foreground'>
                  {entry.speaker}
                </span>
                <span className='text-xs text-muted-foreground tabular-nums'>
                  {entry.timestamp}
                </span>
              </div>
              <p className='text-sm text-foreground leading-relaxed'>
                {entry.text}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
