'use client';

import { Bot, BotOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { switchBot } from '@/features/event/api/calendar-events';

interface BotToggleButtonProps {
  eventId: number;
  isBotAdded: boolean;
}

/**
 * BotToggleButton — adds or removes the recording bot for a calendar event.
 * Uses optimistic local state for immediate feedback, then syncs via router.refresh().
 */
export function BotToggleButton({ eventId, isBotAdded }: BotToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticBotAdded, setOptimisticBotAdded] = useState(isBotAdded);
  const router = useRouter();

  const handleToggle = () => {
    const next = !optimisticBotAdded;
    setOptimisticBotAdded(next);

    startTransition(async () => {
      const result = await switchBot(eventId, next);
      if (result.error) {
        setOptimisticBotAdded(!next); // revert on error
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      className='inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
    >
      {optimisticBotAdded ? (
        <BotOff className='h-3 w-3' />
      ) : (
        <Bot className='h-3 w-3' />
      )}
      {optimisticBotAdded ? 'Remove bot' : 'Add bot'}
    </button>
  );
}
