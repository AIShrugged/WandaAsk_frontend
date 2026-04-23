'use client';

import { isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatDateLabel, formatDateLong } from '@/shared/lib/date-nav';
import { H2 } from '@/shared/ui/typography/H2';

import { useDateNavigation } from './use-date-navigation';

import type { ReactNode } from 'react';

export interface DateNavigatorProps {
  /** YYYY-MM-DD date string */
  date: string;
  /**
   * Visual variant:
   * - 'compact' (default): small bordered buttons + long date format (e.g. "Tuesday, April 22")
   * - 'prominent': transparent buttons + H2 heading with relative labels (e.g. "Today")
   */
  variant?: 'compact' | 'prominent';
  /** Show "Back Today" button when the selected date is not today */
  showBackToday?: boolean;
  /** Extra content rendered after the nav buttons (e.g. a meetings count badge) */
  badge?: ReactNode;
  /** When true, all existing search params are preserved during navigation */
  preserveParams?: boolean;
  className?: string;
}

interface NavButtonProps {
  onClick: () => void;
  icon: typeof ChevronLeft;
  variant: 'compact' | 'prominent';
  label: string;
}

function NavButton({ onClick, icon: Icon, variant, label }: NavButtonProps) {
  if (variant === 'prominent') {
    return (
      <button
        type='button'
        aria-label={label}
        className='cursor-pointer'
        onClick={onClick}
      >
        <Icon />
      </button>
    );
  }

  return (
    <button
      type='button'
      aria-label={label}
      className='flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted'
      onClick={onClick}
    >
      <Icon className='h-4 w-4' />
    </button>
  );
}

interface DateLabelProps {
  date: Date;
  variant: 'compact' | 'prominent';
}

function DateLabel({ date, variant }: DateLabelProps) {
  if (variant === 'prominent') {
    return <H2>{formatDateLabel(date)}</H2>;
  }

  return (
    <span className='min-w-[160px] text-center text-sm font-medium text-foreground'>
      {formatDateLong(date)}
    </span>
  );
}

function BackTodayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='ml-1 rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20'
    >
      Back Today
    </button>
  );
}

export function DateNavigator({
  date,
  variant = 'compact',
  showBackToday = false,
  badge,
  preserveParams = false,
  className,
}: DateNavigatorProps) {
  const { current, navigate, goToday } = useDateNavigation(date, {
    preserveParams,
  });

  const isTodayDate = isToday(current);

  return (
    <div
      className={['flex items-center gap-3', className]
        .filter(Boolean)
        .join(' ')}
    >
      <NavButton
        icon={ChevronLeft}
        variant={variant}
        label='Previous day'
        onClick={() => {
          navigate(-1);
        }}
      />

      <DateLabel date={current} variant={variant} />

      <NavButton
        icon={ChevronRight}
        variant={variant}
        label='Next day'
        onClick={() => {
          navigate(1);
        }}
      />

      {badge}

      {showBackToday && !isTodayDate && <BackTodayButton onClick={goToday} />}
    </div>
  );
}
