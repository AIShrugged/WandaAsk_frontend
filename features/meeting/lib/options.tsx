export const available_tabs = {
  summary: 'summary',
  followup: 'followup',
  transcript: 'transcript',
  analysis: 'analysis',
  tasks: 'tasks',
} as const;

export const validTabs = [
  'summary',
  'followup',
  'transcript',
  'analysis',
  'tasks',
] as const;

export type Tab = (typeof available_tabs)[keyof typeof available_tabs];
