'use client';

import { startOfDay } from 'date-fns';
import { CalendarSearch } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { MeetingCard } from '@/features/meetings/ui/meeting-card';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

type MeetingsResponse = {
  items: CalendarEventListItem[];
  totalCount: number;
};

type Props = {
  initialItems: CalendarEventListItem[];
  totalCount: number;
};

/**
 * parseMeetingDate.
 * @param value - iso date string.
 * @returns timestamp.
 */
function parseMeetingDate(value: string) {
  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * formatMeetingGroupLabel.
 * @param value - meeting date.
 * @returns formatted label.
 */
function formatMeetingGroupLabel(value: Date) {
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
 * MeetingsList component.
 * @param props - component props.
 * @param props.initialItems - first page of meetings.
 * @param props.totalCount - total meeting count.
 * @returns JSX element.
 */
export function MeetingsList({ initialItems, totalCount }: Props) {
  const fetchMore = useCallback(
    async (offset: number) => {
      const res = await fetch(
        `/api/meetings?offset=${offset}&limit=${MEETINGS_PAGE_SIZE}`,
        {
          cache: 'no-store',
        },
      );

      if (!res.ok) {
        throw new Error('Failed to load meetings');
      }

      const json = (await res.json()) as MeetingsResponse;
      const items = Array.isArray(json.items) ? json.items : [];
      const nextOffset = offset + items.length;

      return {
        items,
        hasMore: nextOffset < (json.totalCount ?? totalCount),
      };
    },
    [totalCount],
  );

  const {
    items: rawItems,
    isLoading,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<CalendarEventListItem>({
    fetchMore,
    initialItems,
    initialHasMore: initialItems.length < totalCount,
  });

  const visibleItems = useMemo(() => {
    return rawItems
      .filter((meeting) => {
        return meeting.has_summary;
      })
      .toSorted((left, right) => {
        return (
          parseMeetingDate(right.starts_at) - parseMeetingDate(left.starts_at)
        );
      });
  }, [rawItems]);

  const groupedItems = useMemo(() => {
    const groups = new Map<
      number,
      { label: string; items: CalendarEventListItem[] }
    >();

    for (const meeting of visibleItems) {
      const meetingDate = new Date(meeting.starts_at);
      const key = startOfDay(meetingDate).getTime();
      const currentGroup = groups.get(key);

      if (currentGroup) {
        currentGroup.items.push(meeting);
        continue;
      }

      groups.set(key, {
        label: formatMeetingGroupLabel(meetingDate),
        items: [meeting],
      });
    }

    return [...groups.entries()].toSorted((left, right) => {
      return right[0] - left[0];
    });
  }, [visibleItems]);

  if (visibleItems.length === 0 && !hasMore && !isLoading) {
    return (
      <EmptyState
        icon={CalendarSearch}
        title='No summarized meetings yet'
        description='Only meetings with summaries are shown here.'
      />
    );
  }

  return (
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

      {!hasMore && visibleItems.length > 0 ? (
        <div className='py-4'>
          <InfiniteScrollStatus itemCount={visibleItems.length} />
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
  );
}
