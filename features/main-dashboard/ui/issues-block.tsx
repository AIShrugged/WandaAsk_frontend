'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { IssueStatusBadge } from '@/features/issues/ui/issue-status-badge';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';

import type { Issue } from '@/features/issues/model/types';

const ISSUES_CAP = 10;

interface IssuesBlockProps {
  issues: Issue[];
}

/**
 * IssuesBlock — shows open and in-progress issues sorted by newest first.
 * Clicking a row opens an inline detail panel at 50% width.
 * Clicking the issue title navigates to the full issue page.
 * @param root0
 * @param root0.issues
 */
export function IssuesBlock({ issues }: IssuesBlockProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);

  const displayed = issues.slice(0, ISSUES_CAP);
  const hasMore = issues.length > ISSUES_CAP;

  const selectedIssue =
    issues.find((i) => {
      return i.id === selectedIssueId;
    }) ?? null;

  return (
    <Card className='flex flex-row gap-0 overflow-hidden'>
      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-4 w-4 text-primary' />
            <div>
              <h2 className='text-base font-semibold text-foreground'>
                Issues
              </h2>
            </div>
          </div>
        </div>

        {/* Issue stats deferred: pending GET /api/v1/issues/stats backend endpoint. */}
        {/* Will show: Created / Closed / Done counts for Today / This Week / This Month. */}

        <div className='px-5'>
          {displayed.length === 0 ? (
            <p className='py-8 text-sm text-muted-foreground text-center'>
              No issues
            </p>
          ) : (
            displayed.map((issue) => {
              const relativeTime = formatDistanceToNow(
                parseISO(issue.created_at),
                { addSuffix: true },
              );
              const isSelected = selectedIssueId === issue.id;

              return (
                <div
                  key={issue.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => {
                    setSelectedIssueId(issue.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      setSelectedIssueId(issue.id);
                  }}
                  className={`flex items-center justify-between gap-3 py-3 border-b border-border/50 last:border-0 -mx-5 px-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent/30' : 'hover:bg-accent/20'
                  }`}
                >
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      <span className='text-muted-foreground mr-1'>
                        #{issue.id}
                      </span>
                      <Link
                        href={`${ROUTES.DASHBOARD.ISSUES}/${issue.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className='hover:text-primary transition-colors'
                      >
                        {issue.name}
                      </Link>
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {relativeTime}
                    </p>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    <IssueStatusBadge status={issue.status} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasMore && (
          <div className='px-5 py-3 border-t border-border'>
            <Link
              href={ROUTES.DASHBOARD.ISSUES}
              className='text-xs text-primary hover:underline'
            >
              +{issues.length - ISSUES_CAP} more — View all issues
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            key='issue-detail'
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='shrink-0 border-l border-border overflow-hidden overflow-y-auto min-w-[280px]'
          >
            <div className='flex justify-end px-3 pt-3'>
              <button
                type='button'
                onClick={() => {
                  setSelectedIssueId(null);
                }}
                className='rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors'
                aria-label='Close detail panel'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
