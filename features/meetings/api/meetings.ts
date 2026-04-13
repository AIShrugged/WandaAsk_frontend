'use server';

import { API_URL } from '@/shared/lib/config';
import { ServerError } from '@/shared/lib/errors';
import { httpClientList } from '@/shared/lib/httpClient';

import type { EventProps } from '@/entities/event';
import type { CalendarEventListItem } from '@/features/meetings/model/types';

function toDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Get all personal calendar events for a single day.
 * Backend supports ?date=YYYY-MM-DD (max limit 50 per day).
 */
export async function getMeetingsForDate(
  date: Date,
): Promise<CalendarEventListItem[]> {
  const dateParam = toDateParam(date);
  const params = new URLSearchParams({ date: dateParam, limit: '50' });
  const result = await httpClientList<CalendarEventListItem>(
    `${API_URL}/calendar-events?${params.toString()}`,
  );

  return result.data;
}

/**
 * Fetch personal calendar events for yesterday, today, and tomorrow in parallel.
 * Returns a tuple of [yesterday, today, tomorrow] event arrays.
 */
export async function getMeetingsForThreeDays(): Promise<{
  yesterday: CalendarEventListItem[];
  today: CalendarEventListItem[];
  tomorrow: CalendarEventListItem[];
}> {
  const now = new Date();

  const yesterday = new Date(now);

  yesterday.setDate(now.getDate() - 1);

  const tomorrow = new Date(now);

  tomorrow.setDate(now.getDate() + 1);

  const [yesterdayData, todayData, tomorrowData] = await Promise.all([
    getMeetingsForDate(yesterday),
    getMeetingsForDate(now),
    getMeetingsForDate(tomorrow),
  ]);

  return {
    yesterday: yesterdayData,
    today: todayData,
    tomorrow: tomorrowData,
  };
}

/**
 * Fetch all personal calendar events for a given month by fetching each day in parallel.
 * Uses ?date=YYYY-MM-DD (one request per day) since the backend has no range filter.
 * Only days in the month are fetched. Empty days return [].
 */
export async function getCalendarEventsForMonth(
  month: string,
): Promise<EventProps[]> {
  const base = new Date(month);
  const year = base.getFullYear();
  const monthIndex = base.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const dayRequests = Array.from({ length: daysInMonth }, (_, i) => {
    const day = new Date(year, monthIndex, i + 1);

    return getMeetingsForDate(day) as Promise<EventProps[]>;
  });

  const results = await Promise.all(dayRequests);

  return results.flat();
}

export interface TranscriptParticipant {
  id: number;
  name: string | null;
  email: string | null;
}

export interface TranscriptEntry {
  id: number;
  participant: TranscriptParticipant;
  text: string;
  start_relative: number;
  end_relative: number;
  start_absolute: string;
  end_absolute: string;
}

/**
 * Fetch transcript entries for a calendar event.
 * Returns null if the transcript is not available (404).
 */
export async function getMeetingTranscript(
  id: string,
): Promise<TranscriptEntry[] | null> {
  try {
    const params = new URLSearchParams({ limit: '500' });
    const result = await httpClientList<TranscriptEntry>(
      `${API_URL}/calendar-events/${id}/transcript?${params.toString()}`,
    );

    return result.data;
  } catch (error) {
    if (error instanceof ServerError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
