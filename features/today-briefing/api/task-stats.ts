'use server';

// Re-exports kept for backwards compatibility during migration.
// Canonical location: features/issues/api/issue-stats.ts
export type {
  IssueStatsDelta,
  IssueStats,
} from '@/features/issues/model/types';
export { getIssueStats } from '@/features/issues/api/issue-stats';
