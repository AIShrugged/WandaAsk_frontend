export const available_tabs = {
  summary: 'summary',
  followup: 'followup',
  transcript: 'transcript',
  analysis: 'analysis',
} as const;

export const validTabs = [
  'summary',
  'followup',
  'transcript',
  'analysis',
] as const;

export type Tab = (typeof available_tabs)[keyof typeof available_tabs];
