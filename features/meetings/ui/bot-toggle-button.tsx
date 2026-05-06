'use client';

import { Bot, BotOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { switchBot } from '@/features/event/api/calendar-events';
import { Button } from '@/shared/ui/button';

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
    <Button
      variant='pill'
      size='xs'
      fullWidth={false}
      disabled={isPending}
      leftIcon={
        optimisticBotAdded ? (
          <BotOff className='h-3 w-3' />
        ) : (
          <Bot className='h-3 w-3' />
        )
      }
      onClick={(e) => {
        e.stopPropagation();
        handleToggle();
      }}
    >
      {optimisticBotAdded ? 'Remove bot' : 'Add bot'}
    </Button>
  );
}
