'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Target, X } from 'lucide-react';
import { useState } from 'react';

import type { UserFocus } from '../types';

export const FOCUS_BANNER_DISMISS_KEY = 'focus-banner-dismissed';

function formatDeadlineBrief(deadline: string): string {
  const date = parseISO(deadline);
  const daysLeft = differenceInCalendarDays(date, new Date());
  if (daysLeft < 0) return 'overdue';
  if (daysLeft === 0) return 'today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

function isFocusExpired(focus: UserFocus): boolean {
  if (!focus.expires_at) return false;
  return new Date(focus.expires_at) < new Date();
}

interface FocusReminderBannerProps {
  focus: UserFocus | null;
}

export function FocusReminderBanner({ focus }: FocusReminderBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (globalThis.window === undefined) return false;
    return globalThis.sessionStorage.getItem(FOCUS_BANNER_DISMISS_KEY) === '1';
  });

  if (!focus?.focus_text || dismissed) return null;
  if (isFocusExpired(focus)) return null;

  function handleDismiss() {
    globalThis.sessionStorage.setItem(FOCUS_BANNER_DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className='flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm'>
      <Target className='h-3.5 w-3.5 text-primary shrink-0' />
      <span className='text-muted-foreground'>Focus:</span>
      <span className='text-foreground truncate'>{focus.focus_text}</span>
      {focus.deadline !== null && (
        <span className='text-xs text-muted-foreground shrink-0'>
          · {formatDeadlineBrief(focus.deadline)}
        </span>
      )}
      <button
        onClick={handleDismiss}
        aria-label='Dismiss focus reminder'
        className='ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors'
      >
        <X className='h-3.5 w-3.5' />
      </button>
    </div>
  );
}
