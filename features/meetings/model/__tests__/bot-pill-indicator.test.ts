import { getBotPillIndicator } from '../bot-pill-indicator';

import type { MeetingDisplayState } from '../meeting-state';

describe('getBotPillIndicator', () => {
  const cases: Array<[MeetingDisplayState, string, string, string]> = [
    ['active', 'bot', 'text-emerald-400', 'Bot in meeting'],
    ['upcoming_with_bot', 'bot', 'text-primary-foreground', 'Bot scheduled'],
    ['upcoming_no_bot', 'bot-off', 'text-primary-foreground/40', 'No bot'],
    ['past_with_summary', 'bot', 'text-primary', 'Bot attended'],
    ['past_missed_bot', 'bot-off', 'text-destructive', 'Bot missed'],
    ['past_no_bot', 'bot-off', 'text-muted-foreground/30', 'No bot'],
  ];

  it.each(cases)(
    'state=%s → icon=%s, colorClass=%s, label=%s',
    (state, icon, colorClass, label) => {
      const indicator = getBotPillIndicator(state);
      expect(indicator.icon).toBe(icon);
      expect(indicator.colorClass).toBe(colorClass);
      expect(indicator.label).toBe(label);
    },
  );

  it('covers all 6 MeetingDisplayState values', () => {
    const states: MeetingDisplayState[] = [
      'active',
      'upcoming_with_bot',
      'upcoming_no_bot',
      'past_with_summary',
      'past_missed_bot',
      'past_no_bot',
    ];
    for (const state of states) {
      expect(() => {
        return getBotPillIndicator(state);
      }).not.toThrow();
    }
  });
});
