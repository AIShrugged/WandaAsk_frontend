import type { MeetingDisplayState } from './meeting-state';

export type BotPillIndicator = {
  icon: 'bot' | 'bot-off';
  colorClass: string;
  label: string;
};

const INDICATOR_MAP: Record<MeetingDisplayState, BotPillIndicator> = {
  active: {
    icon: 'bot',
    colorClass: 'text-emerald-400',
    label: 'Bot in meeting',
  },
  upcoming_with_bot: {
    icon: 'bot',
    colorClass: 'text-primary-foreground',
    label: 'Bot scheduled',
  },
  upcoming_no_bot: {
    icon: 'bot-off',
    colorClass: 'text-primary-foreground/40',
    label: 'No bot',
  },
  past_with_summary: {
    icon: 'bot',
    colorClass: 'text-primary',
    label: 'Bot attended',
  },
  past_missed_bot: {
    icon: 'bot-off',
    colorClass: 'text-destructive',
    label: 'Bot missed',
  },
  past_no_bot: {
    icon: 'bot-off',
    colorClass: 'text-muted-foreground/30',
    label: 'No bot',
  },
};

export function getBotPillIndicator(
  state: MeetingDisplayState,
): BotPillIndicator {
  return INDICATOR_MAP[state];
}
