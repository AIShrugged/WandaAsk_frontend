// Public API for the meetings feature

export { MeetingsColumnView } from './ui/meetings-column-view';
export { MeetingsDayView } from './ui/meetings-day-view';
export { DateSwitcher } from './ui/date-switcher';
export { MeetingCard } from './ui/meeting-card';
export { MeetingDetailTabsNav } from './ui/meeting-detail-tabs-nav';
export { MeetingsTabsNav } from './ui/meetings-tabs-nav';
export { BotToggleButton } from './ui/bot-toggle-button';
export { MeetingJoinButton } from './ui/meeting-join-button';
export { MeetingCalendarPopover } from './ui/meeting-calendar-popover';
export { OrgCalendarEvent } from './ui/org-calendar-event';
export { OrgCalendarView } from './ui/org-calendar-view';

export type {
  CalendarEventListItem,
  CalendarEventDetailResponse,
  CalendarEventAgendaItem,
  CalendarEventParticipant,
  CalendarEventSectionValue,
  CalendarEventReadMore,
  CalendarEventTakeaway,
} from './model/types';
export {
  getMeetingDisplayState,
  type MeetingDisplayState,
} from './model/meeting-state';
export {
  getBotPillIndicator,
  type BotPillIndicator,
} from './model/bot-pill-indicator';
export { BotPillIcon } from './ui/bot-pill-icon';
export {
  getMeetingsForDate,
  getMeetingsForThreeDays,
  getCalendarEventsForMonth,
} from './api/meetings';
export { getOrgCalendarEvents } from './api/org-calendar';
