'use client';

import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { generateNudge } from '../api/nudge';

interface AiNudgeProps {
  text: string | null;
  date: string;
}

export function AiNudge({ text, date }: AiNudgeProps) {
  const [nudge, setNudge] = useState<string | null>(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (text) {
      setNudge(text);
      return;
    }

    let cancelled = false;

    // No cached nudge — generate in background
    async function fetchNudge() {
      setLoading(true);
      try {
        const result = await generateNudge(date);
        if (!cancelled) setNudge(result);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchNudge();
    return () => {
      cancelled = true;
    };
  }, [text, date]);

  if (loading) {
    return (
      <div className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'>
        <Loader2 className='h-4 w-4 shrink-0 text-muted-foreground animate-spin' />
        <p className='text-sm text-muted-foreground'>
          Generating AI insight...
        </p>
      </div>
    );
  }

  if (!nudge) return null;

  return (
    <div className='flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3'>
      <AlertCircle className='h-4 w-4 shrink-0 text-amber-500 mt-0.5' />
      <p className='text-sm text-foreground'>{nudge}</p>
    </div>
  );
}
