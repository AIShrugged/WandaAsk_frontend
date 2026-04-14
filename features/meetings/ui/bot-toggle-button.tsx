'use client';

import { Bot, BotOff } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { switchBot } from '@/features/event/api/calendar-events';

interface BotToggleButtonProps {
  eventId: number;
  isBotAdded: boolean;
}

/**
 * BotToggleButton — adds or removes the recording bot for a calendar event.
 * Uses useTransition for a non-blocking async toggle.
 */
export function BotToggleButton({ eventId, isBotAdded }: BotToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await switchBot(eventId, !isBotAdded);
      } catch {
        toast.error(isBotAdded ? 'Failed to remove bot' : 'Failed to add bot');
      }
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
      {isBotAdded ? (
        <BotOff className='h-3 w-3' />
      ) : (
        <Bot className='h-3 w-3' />
      )}
      {isBotAdded ? 'Remove bot' : 'Add bot'}
    </button>
  );
}
