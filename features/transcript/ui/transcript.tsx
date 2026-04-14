import { MicOff } from 'lucide-react';

import { loadTranscriptChunk } from '@/features/transcript/api/transcript';
import { filters } from '@/features/transcript/lib/options';
import TranscriptHistory from '@/features/transcript/ui/transcript-history';
import { ServerError } from '@/shared/lib/errors';

/**
 * Transcript server component — fetches the initial chunk and renders the
 * infinite-scroll history, or an empty state when no transcript exists.
 * @param props - Component props.
 * @param props.id
 */
export default async function Transcript({ id }: { id: string }) {
  let items;
  let totalCount;

  try {
    const result = await loadTranscriptChunk(id, 0, filters.limit * 2);

    items = result.items;
    totalCount = result.totalCount;
  } catch (error) {
    if (error instanceof ServerError && error.status === 404) {
      items = [];
      totalCount = 0;
    } else {
      throw error;
    }
  }

  if (items.length === 0) {
    return (
      <div className='flex flex-col items-center gap-4 py-20 text-center'>
        <MicOff
          className='h-10 w-10 text-muted-foreground/40'
          aria-hidden='true'
        />
        <div>
          <p className='text-sm font-medium text-foreground'>
            Transcript not available
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            No transcript has been recorded for this meeting yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TranscriptHistory
      eventId={id}
      initialItems={items}
      initialTotal={totalCount}
    />
  );
}
