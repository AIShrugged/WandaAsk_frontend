'use client';

import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef } from 'react';

import { usePopup } from '@/shared/hooks/use-popup';
import {
  formatDateLabel,
  formatDateLong,
  toDateParam,
} from '@/shared/lib/date-nav';
import { H2 } from '@/shared/ui/typography/H2';

import { useDateNavigation } from './use-date-navigation';

import type { ReactNode } from 'react';

const DayPicker = dynamic(
  () => {
    return import('react-day-picker').then((m) => {
      return {
        default: m.DayPicker,
      };
    });
  },
  {
    ssr: false,
    loading: () => {
      return null;
    },
  },
);

interface NavigateToDateOptions {
  preserveParams: boolean;
  params: URLSearchParams;
  pathname: string;
  router: ReturnType<typeof useRouter>;
}

function navigateToDate(
  day: Date,
  { preserveParams, params, pathname, router }: NavigateToDateOptions,
) {
  const newDateStr = toDateParam(day);

  if (preserveParams) {
    const next = new URLSearchParams(params);

    next.set('date', newDateStr);
    router.push(`?${next.toString()}`, { scroll: false });
  } else {
    router.push(`${pathname}?date=${newDateStr}`, { scroll: false });
  }
}

const CALENDAR_CLASS_NAMES = {
  root: 'w-full',
  months: 'flex flex-col',
  month: 'space-y-2',
  month_caption: 'flex items-center justify-between px-1 pb-1 relative h-9',
  caption_label:
    'text-sm font-semibold text-foreground absolute left-1/2 -translate-x-1/2',
  nav: 'flex items-center gap-1',
  button_previous:
    'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  button_next:
    'flex h-7 w-7 items-center justify-center rounded-[var(--radius-button)] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed',
  chevron: 'h-4 w-4',
  weekdays: 'flex',
  weekday: 'w-9 text-center text-xs font-medium text-muted-foreground',
  weeks: '',
  week: 'flex w-full mt-1',
  day: 'relative p-0',
  day_button: [
    'h-9 w-9 rounded-[var(--radius-button)] text-sm',
    'flex items-center justify-center',
    'transition-colors cursor-pointer text-foreground',
    'hover:bg-secondary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  ].join(' '),
  selected: [
    'bg-primary text-primary-foreground font-medium',
    'hover:bg-primary/90',
    'ring-1 ring-primary-foreground/20 ring-inset',
  ].join(' '),
  today: 'ring-1 ring-primary/60 text-primary font-medium',
  outside: 'text-muted-foreground opacity-40',
  disabled: 'opacity-30 cursor-not-allowed pointer-events-none',
  hidden: 'invisible',
} as const;

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
  ref?: React.Ref<HTMLButtonElement>;
  onPickerOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isPickerOpen: boolean;
}

function DateLabel({
  date,
  variant,
  ref,
  onPickerOpen,
  isPickerOpen,
}: DateLabelProps) {
  if (variant === 'prominent') {
    return (
      <button
        ref={ref}
        type='button'
        onClick={onPickerOpen}
        className='cursor-pointer rounded-[var(--radius-button)] transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
        aria-label='Pick a date'
        aria-haspopup='dialog'
        aria-expanded={isPickerOpen}
      >
        <span className='flex items-center gap-2'>
          <H2>{formatDateLabel(date)}</H2>
          <CalendarDays className='h-4 w-4 text-muted-foreground' />
        </span>
      </button>
    );
  }

  return (
    <button
      ref={ref}
      type='button'
      onClick={onPickerOpen}
      className='flex min-w-[160px] items-center gap-1.5 rounded-[var(--radius-button)] text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
      aria-label='Pick a date'
      aria-haspopup='dialog'
      aria-expanded={isPickerOpen}
    >
      <CalendarDays className='h-4 w-4 shrink-0 text-primary/60' />
      {formatDateLong(date)}
    </button>
  );
}

export function DateNavigator({
  date,
  variant = 'compact',
  showBackToday,
  badge,
  preserveParams = false,
  className,
}: DateNavigatorProps) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const { current, navigate, goToday } = useDateNavigation(date, {
    preserveParams,
  });
  const { isOpen: isPickerOpen, open, close } = usePopup();
  const labelRef = useRef<HTMLButtonElement>(null);

  const handlePickerOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isPickerOpen) {
      close();
      return;
    }

    if (!labelRef.current) return;

    // Capture current values at the time of open for the render-function closure.
    // Using a render function (not a ReactNode) prevents stale frozen content
    // when the parent re-renders while the popup is open.
    const selectedDate = current;
    const navOptions = { preserveParams, params, pathname, router };

    open(labelRef.current, {
      width: 288,
      maxHeight: 340,
      preferredPosition: 'bottom',
      offset: 8,
      content: () => {
        return (
          <div
            role='dialog'
            aria-modal='true'
            aria-label='Date picker'
            className='rounded-[var(--radius-card)] border border-border bg-card p-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)] ring-1 ring-primary/10'
          >
            <div className='flex justify-between'>
              <DayPicker
                mode='single'
                selected={selectedDate}
                defaultMonth={selectedDate}
                onSelect={(day) => {
                  if (!day) return;
                  close();
                  navigateToDate(day, navOptions);
                }}
                weekStartsOn={1}
                showOutsideDays
                classNames={CALENDAR_CLASS_NAMES}
              />
            </div>
          </div>
        );
      },
    });
  };

  // Close picker when chevron navigation fires (prevents stale selected date).
  const handleNavigate = (offset: number) => {
    if (isPickerOpen) close();
    navigate(offset);
  };

  const isToday = current.toDateString() === new Date().toDateString();

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
          handleNavigate(-1);
        }}
      />

      <DateLabel
        ref={labelRef}
        date={current}
        variant={variant}
        onPickerOpen={handlePickerOpen}
        isPickerOpen={isPickerOpen}
      />

      <NavButton
        icon={ChevronRight}
        variant={variant}
        label='Next day'
        onClick={() => {
          handleNavigate(1);
        }}
      />

      {showBackToday && !isToday && (
        <button
          type='button'
          onClick={goToday}
          className='text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline'
        >
          Back to today
        </button>
      )}

      {badge}
    </div>
  );
}
