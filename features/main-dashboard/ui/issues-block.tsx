import { formatDistanceToNow, parseISO } from 'date-fns';
import { AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import type { Issue } from '@/features/issues/model/types';

const STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive'
> = {
  open: 'default',
  in_progress: 'warning',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
};

const ISSUES_CAP = 10;

interface IssuesBlockProps {
  issues: Issue[];
}

/**
 * IssuesBlock — shows open and in-progress issues sorted by newest first.
 * @param root0
 * @param root0.issues
 */
export function IssuesBlock({ issues }: IssuesBlockProps) {
  const displayed = issues.slice(0, ISSUES_CAP);
  const hasMore = issues.length > ISSUES_CAP;

  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <AlertCircle className='h-4 w-4 text-primary' />
          <div>
            <h2 className='text-base font-semibold text-foreground'>Issues</h2>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-xs text-muted-foreground'>
            Open &amp; In Progress · Newest first
          </span>
          <Link
            href={ROUTES.DASHBOARD.ISSUES}
            className='text-xs text-primary hover:underline'
          >
            View all
          </Link>
        </div>
      </div>

      {/* Issue stats deferred: pending GET /api/v1/issues/stats backend endpoint. */}
      {/* Will show: Created / Closed / Done counts for Today / This Week / This Month. */}

      <div className='px-5'>
        {displayed.length === 0 ? (
          <p className='py-8 text-sm text-muted-foreground text-center'>
            No open or in-progress issues
          </p>
        ) : (
          displayed.map((issue) => {
            const statusVariant = STATUS_VARIANT[issue.status] ?? 'default';
            const statusLabel = STATUS_LABEL[issue.status] ?? issue.status;
            const relativeTime = formatDistanceToNow(
              parseISO(issue.created_at),
              { addSuffix: true },
            );

            return (
              <Link
                key={issue.id}
                href={`${ROUTES.DASHBOARD.ISSUES}/${issue.id}`}
                className='flex items-center justify-between gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-accent/20 -mx-5 px-5 transition-colors'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium text-foreground truncate'>
                    <span className='text-muted-foreground mr-1'>
                      #{issue.id}
                    </span>
                    {issue.name}
                  </p>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {relativeTime}
                  </p>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <Badge variant={statusVariant} className='capitalize'>
                    {statusLabel}
                  </Badge>
                  <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
                </div>
              </Link>
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
    </Card>
  );
}
