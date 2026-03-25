export const available_tabs = {
  summary: 'summary',
  transcript: 'transcript',
  analysis: 'analysis',
  tasks: 'tasks',
} as const;

export const validTabs = [
  'summary',
  'transcript',
  'analysis',
  'tasks',
] as const;

export type Tab = (typeof available_tabs)[keyof typeof available_tabs];
