'use client';

import { X, ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import { IssueStatusBadge } from './issue-status-badge';

import type { ExtendedIssueStatus } from './issue-status-badge';
import type { CriticalPathNode, CriticalPathEdge } from '../model/types';

interface CriticalPathNodeDetailProps {
  node: CriticalPathNode;
  allNodes: CriticalPathNode[];
  edges: CriticalPathEdge[];
  onClose: () => void;
  onSelectNode: (id: number) => void;
}

const VALID_STATUSES = new Set(['open', 'in_progress', 'paused', 'done', 'review', 'reopen']);
const BORDER_COLOR = 'hsl(var(--border))';

function isValidStatus(s: string | null): s is ExtendedIssueStatus {
  return VALID_STATUSES.has(s ?? '');
}

interface CpmCellProps {
  label: string;
  value: number | null;
  sub?: string;
  highlight?: boolean;
}

function CpmCell({
  label,
  value,
  sub,
  highlight,
}: CpmCellProps) {
  return (
    <div
      className='rounded-lg p-2.5 border'
      style={{
        background: 'hsl(var(--muted))',
        borderColor: highlight ? 'hsl(var(--destructive) / 0.3)' : BORDER_COLOR,
      }}
    >
      <p className='text-[10px] text-muted-foreground mb-0.5'>{label}</p>
      <p
        className='text-lg font-bold leading-none'
        style={{ color: highlight ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}
      >
        {value ?? '—'}
      </p>
      {sub && <p className='text-[10px] text-muted-foreground mt-0.5'>{sub}</p>}
    </div>
  );
}

function DepItem({
  node,
  onClick,
}: {
  node: CriticalPathNode;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-left text-xs border transition-colors hover:bg-muted/30'
      style={{
        borderColor: node.is_critical
          ? 'hsl(var(--destructive) / 0.25)'
          : BORDER_COLOR,
        background: 'hsl(var(--muted))',
        color: node.is_critical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
      }}
    >
      <span
        className='w-1.5 h-1.5 rounded-full shrink-0'
        style={{ background: node.is_critical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }}
      />
      <span className='flex-1 truncate'>
        {node.issue_name ?? `Issue #${node.issue_id}`}
      </span>
    </button>
  );
}

export function CriticalPathNodeDetail({
  node,
  allNodes,
  edges,
  onClose,
  onSelectNode,
}: CriticalPathNodeDetailProps) {
  const nodeMap = new Map(allNodes.map((n) => {return [n.node_id, n]}));

  const predecessors = edges
    .filter((e) => {return e.to_node_id === node.node_id})
    .map((e) => {return nodeMap.get(e.from_node_id)})
    .filter((n): n is CriticalPathNode => {return n !== undefined});

  const successors = edges
    .filter((e) => {return e.from_node_id === node.node_id})
    .map((e) => {return nodeMap.get(e.to_node_id)})
    .filter((n): n is CriticalPathNode => {return n !== undefined});

  const slack = node.slack ?? 0;

  return (
    <div
      className='flex flex-col border-l overflow-y-auto shrink-0'
      style={{
        width: 280,
        background: 'hsl(var(--background))',
        borderColor: BORDER_COLOR,
      }}
    >
      {/* Header */}
      <div
        className='px-4 py-3 shrink-0 border-b'
        style={{ borderColor: BORDER_COLOR }}
      >
        <div className='flex items-start justify-between gap-2'>
          <p className='text-sm font-semibold leading-snug text-card-foreground'>
            {node.issue_name ?? `Issue #${node.issue_id}`}
          </p>
          <button
            type='button'
            onClick={onClose}
            className='shrink-0 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
        <div className='flex flex-wrap gap-1.5 mt-2'>
          {isValidStatus(node.status) && (
            <IssueStatusBadge status={node.status} />
          )}
          {node.is_critical && (
            <Badge variant='destructive' className='gap-1'>
              <Zap className='w-2.5 h-2.5' />
              Critical
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className='flex flex-col gap-3.5 px-4 py-3.5'>
        {/* CPM params */}
        <div>
          <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2'>
            CPM Parameters
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <CpmCell label='Duration' value={node.duration_days} sub='days' />
            <CpmCell
              label='Slack'
              value={slack}
              sub='days'
              highlight={slack === 0}
            />
            <CpmCell
              label='Early Start'
              value={node.early_start}
              sub={node.early_start == null ? undefined : `Day ${node.early_start + 1}`}
            />
            <CpmCell
              label='Early Finish'
              value={node.early_finish}
              sub={node.early_finish == null ? undefined : `Day ${node.early_finish}`}
            />
            <CpmCell
              label='Late Start'
              value={node.late_start}
              sub='latest start'
            />
            <CpmCell
              label='Late Finish'
              value={node.late_finish}
              sub='latest finish'
            />
          </div>
        </div>

        {/* Due date */}
        {node.due_date && (
          <div>
            <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
              Due Date
            </p>
            <p className='text-sm text-foreground'>
              {node.due_date}
            </p>
          </div>
        )}

        {/* Dependencies */}
        {predecessors.length > 0 && (
          <div>
            <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
              Depends on
            </p>
            <div className='flex flex-col gap-1.5'>
              {predecessors.map((dep) => {return (
                <DepItem
                  key={dep.node_id}
                  node={dep}
                  onClick={() => {return onSelectNode(dep.node_id)}}
                />
              )})}
            </div>
          </div>
        )}

        {/* Blocks */}
        {successors.length > 0 && (
          <div>
            <p className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
              Blocks
            </p>
            <div className='flex flex-col gap-1.5'>
              {successors.map((dep) => {return (
                <DepItem
                  key={dep.node_id}
                  node={dep}
                  onClick={() => {return onSelectNode(dep.node_id)}}
                />
              )})}
            </div>
          </div>
        )}

        {/* Open issue link */}
        <Link
          href={`${ROUTES.DASHBOARD.ISSUES}/${node.issue_id}`}
          className='flex items-center gap-1.5 text-xs text-primary hover:underline mt-1'
        >
          Open issue
          <ExternalLink className='w-3 h-3' />
        </Link>
      </div>
    </div>
  );
}
