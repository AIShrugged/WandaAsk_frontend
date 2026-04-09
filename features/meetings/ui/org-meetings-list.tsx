'use client';

import { startOfDay } from 'date-fns';
import { CalendarSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { MeetingCard } from '@/features/meetings/ui/meeting-card';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

type OrgMeetingsResponse = {
  items: CalendarEventListItem[];
  totalCount: number;
};

type Props = {
  initialItems: CalendarEventListItem[];
  totalCount: number;
  defaultDateFrom: string;
  defaultDateTo: string;
};

/**
 * formatGroupLabel.
 * @param value - meeting date.
 * @returns formatted label.
 */
function formatGroupLabel(value: Date) {
  const now = new Date();
  const diffDays = Math.round(
    (startOfDay(value).getTime() - startOfDay(now).getTime()) / 86_400_000,
  );

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(value);

  if (diffDays === 0) return `Today, ${dateLabel}`;
  if (diffDays === 1) return `Tomorrow, ${dateLabel}`;
  if (diffDays === -1) return `Yesterday, ${dateLabel}`;

  return dateLabel;
}

/**
 * Group meetings by calendar day (descending).
 */
function groupByDay(items: CalendarEventListItem[]) {
  const sorted = items.toSorted((a, b) => {
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });

  const groups = new Map<
    number,
    { label: string; items: CalendarEventListItem[] }
  >();

  for (const meeting of sorted) {
    const meetingDate = new Date(meeting.starts_at);
    const key = startOfDay(meetingDate).getTime();
    const group = groups.get(key);

    if (group) {
      group.items.push(meeting);
    } else {
      groups.set(key, {
        label: formatGroupLabel(meetingDate),
        items: [meeting],
      });
    }
  }

  return [...groups.entries()].toSorted(([a], [b]) => {
    return b - a;
  });
}

/**
 * OrgMeetingsList — organization-wide bot meetings with date filter and infinite scroll.
 * @param props - Component props.
 * @param props.initialItems - First page of org meetings from SSR.
 * @param props.totalCount - Total meeting count.
 * @param props.defaultDateFrom - Default start date (YYYY-MM-DD).
 * @param props.defaultDateTo - Default end date (YYYY-MM-DD).
 */
export function OrgMeetingsList({
  initialItems,
  totalCount,
  defaultDateFrom,
  defaultDateTo,
}: Props) {
  const router = useRouter();

  const fetchMore = useCallback(
    async (offset: number) => {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(MEETINGS_PAGE_SIZE),
        date_from: defaultDateFrom,
        date_to: defaultDateTo,
      });

      const res = await fetch(`/api/org-meetings?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to load organization meetings');
      }

      const json = (await res.json()) as OrgMeetingsResponse;
      const items = Array.isArray(json.items) ? json.items : [];
      const nextOffset = offset + items.length;

      return {
        items,
        hasMore: nextOffset < (json.totalCount ?? totalCount),
      };
    },
    [defaultDateFrom, defaultDateTo, totalCount],
  );

  const { items, isLoading, hasMore, sentinelRef } =
    useInfiniteScroll<CalendarEventListItem>({
      fetchMore,
      initialItems,
      initialHasMore: initialItems.length < totalCount,
    });

  const groupedItems = groupByDay(items);

  function handleDateChange(field: 'date_from' | 'date_to', value: string) {
    const params = new URLSearchParams();
    params.set('date_from', field === 'date_from' ? value : defaultDateFrom);
    params.set('date_to', field === 'date_to' ? value : defaultDateTo);
    router.push(`/dashboard/meetings/organization?${params.toString()}`);
  }

  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <div className='mb-6 flex flex-wrap items-center gap-3'>
        <span className='text-sm font-medium text-muted-foreground'>
          Date range:
        </span>

        <div className='flex items-center gap-2'>
          <input
            type='date'
            value={defaultDateFrom}
            onChange={(e) => {
              handleDateChange('date_from', e.target.value);
            }}
            className='rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
          />

          <span className='text-sm text-muted-foreground'>to</span>

          <input
            type='date'
            value={defaultDateTo}
            onChange={(e) => {
              handleDateChange('date_to', e.target.value);
            }}
            className='rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
      </div>

      {items.length === 0 && !hasMore && !isLoading ? (
        <EmptyState
          icon={CalendarSearch}
          title='No bot meetings in this period'
          description='No meetings with the bot were found for the selected date range.'
        />
      ) : (
        <div className='flex flex-col gap-6'>
          {groupedItems.map(([key, group]) => {
            return (
              <section key={key} className='flex flex-col gap-3'>
                <div className='px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/90'>
                  {group.label}
                </div>

                <div className='flex flex-col gap-4'>
                  {group.items.map((meeting) => {
                    return <MeetingCard key={meeting.id} meeting={meeting} />;
                  })}
                </div>
              </section>
            );
          })}

          {!hasMore && items.length > 0 ? (
            <div className='py-4'>
              <InfiniteScrollStatus itemCount={items.length} />
            </div>
          ) : (
            <div ref={sentinelRef} className='h-10' />
          )}

          {isLoading && (
            <div className='flex justify-center py-4'>
              <SpinLoader />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
