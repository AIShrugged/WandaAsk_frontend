import { Target } from 'lucide-react';
import Link from 'next/link';

export const FOCUS_BANNER_DISMISS_KEY = 'focus-banner-dismissed';

import { ROUTES } from '@/shared/lib/routes';

import { getFocusedIssues } from '../api/focused-issues';

import type { UserFocus } from '../types';

interface FocusReminderBannerProps {
  focus: UserFocus | null;
}

export async function FocusReminderBanner({ focus }: FocusReminderBannerProps) {
  if (!focus?.focus_text) {
    return (
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Target className='h-4 w-4 text-muted-foreground shrink-0' />
          <span className='text-sm font-medium text-muted-foreground'>
            Focused Tasks
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>
          No focus set.{' '}
          <Link
            href={ROUTES.DASHBOARD.PROFILE_ACCOUNT}
            className='underline hover:text-foreground'
          >
            Set your focus
          </Link>{' '}
          to surface relevant tasks here.
        </p>
      </div>
    );
  }

  const { issues, hasFocus, matchedCount } = await getFocusedIssues();

  if (!hasFocus || issues.length === 0) {
    return (
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Target className='h-4 w-4 text-primary shrink-0' />
          <span className='text-sm font-medium text-foreground'>
            Focused Tasks
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>
          No tasks match your current focus.
        </p>
      </div>
    );
  }

  const isFallback = matchedCount === 0;

  return (
    <div className='rounded-[var(--radius-card)] border border-primary/30 bg-primary/5 p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <Target className='h-4 w-4 text-primary shrink-0' />
        <span className='text-sm font-medium text-foreground'>
          Focused Tasks
        </span>
        {isFallback && (
          <span className='text-xs text-muted-foreground ml-1'>
            (critical priority)
          </span>
        )}
      </div>
      <div className='flex flex-col gap-2'>
        {issues.map((issue) => {
          return (
            <Link
              key={issue.id}
              href={`${ROUTES.DASHBOARD.ISSUES}/${issue.id}`}
              className='flex items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2 text-sm hover:bg-background transition-colors group'
            >
              <span className='truncate text-foreground group-hover:text-primary transition-colors'>
                {issue.name}
              </span>
              {issue.due_date !== null && (
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {issue.due_date}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
