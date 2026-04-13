import type { CalendarEventListItem } from './types';

export type MeetingDisplayState =
  | 'active'
  | 'upcoming_with_bot'
  | 'upcoming_no_bot'
  | 'past_with_summary'
  | 'past_missed_bot'
  | 'past_no_bot';

/**
 * Derive the visual display state for a calendar event.
 *
 * Rules:
 *  - active:           meeting is currently in progress (started but not ended)
 *  - upcoming_with_bot: future meeting with bot required
 *  - upcoming_no_bot:  future meeting with no bot
 *  - past_with_summary: past meeting that has a summary
 *  - past_missed_bot:  past meeting with bot required but no summary
 *  - past_no_bot:      past meeting with no bot and no summary
 */
export function getMeetingDisplayState(
  meeting: Pick<
    CalendarEventListItem,
    'starts_at' | 'ends_at' | 'required_bot' | 'has_summary'
  >,
  now: Date = new Date(),
): MeetingDisplayState {
  const startsAt = new Date(meeting.starts_at.replace(' ', 'T'));
  const endsAt = new Date(meeting.ends_at.replace(' ', 'T'));
  const isActive = startsAt <= now && now <= endsAt;
  const isPast = endsAt < now;

  if (isActive) return 'active';

  if (!isPast) {
    return meeting.required_bot ? 'upcoming_with_bot' : 'upcoming_no_bot';
  }

  if (meeting.has_summary) return 'past_with_summary';

  return meeting.required_bot ? 'past_missed_bot' : 'past_no_bot';
}
