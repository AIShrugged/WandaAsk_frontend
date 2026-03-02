'use client';

import {
  BarChart2,
  ChevronLeft,
  ClipboardList,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { getArtifacts } from '@/features/chat/api/artifacts';
import { ChartArtifactView } from '@/features/chat/ui/artifacts/chart-artifact';
import { InsightCard } from '@/features/chat/ui/artifacts/insight-card';
import { MeetingCard } from '@/features/chat/ui/artifacts/meeting-card';
import { PeopleList } from '@/features/chat/ui/artifacts/people-list';
import { TaskTable } from '@/features/chat/ui/artifacts/task-table';
import { TranscriptView } from '@/features/chat/ui/artifacts/transcript-view';
import { CollapsedSidePanel } from '@/shared/ui/layout/collapsed-side-panel';

import type {
  Artifact,
  ArtifactType,
  ArtifactsResponse,
  ChartArtifact,
  InsightCardArtifact,
  MeetingCardArtifact,
  PeopleListArtifact,
  TaskTableArtifact,
  TranscriptArtifact,
} from '@/features/chat/types';

const POLLING_INTERVAL_MS = 5000;

const TYPE_META: Record<
  ArtifactType,
  { label: string; icon: React.ReactNode }
> = {
  task_table: {
    label: 'Tasks',
    icon: <ClipboardList className='w-3.5 h-3.5' />,
  },
  meeting_card: { label: 'Meeting', icon: <Video className='w-3.5 h-3.5' /> },
  people_list: { label: 'People', icon: <Users className='w-3.5 h-3.5' /> },
  insight_card: { label: 'Insight', icon: <Zap className='w-3.5 h-3.5' /> },
  chart: { label: 'Chart', icon: <BarChart2 className='w-3.5 h-3.5' /> },
  transcript_view: {
    label: 'Transcript',
    icon: <FileText className='w-3.5 h-3.5' />,
  },
};

function ArtifactContent({ artifact }: { artifact: Artifact }) {
  switch (artifact.type) {
    case 'task_table': {
      return <TaskTable data={(artifact as TaskTableArtifact).data} />;
    }
    case 'meeting_card': {
      return <MeetingCard data={(artifact as MeetingCardArtifact).data} />;
    }
    case 'people_list': {
      return <PeopleList data={(artifact as PeopleListArtifact).data} />;
    }
    case 'insight_card': {
      return <InsightCard data={(artifact as InsightCardArtifact).data} />;
    }
    case 'chart': {
      return <ChartArtifactView data={(artifact as ChartArtifact).data} />;
    }
    case 'transcript_view': {
      return <TranscriptView data={(artifact as TranscriptArtifact).data} />;
    }
    default: {
      return (
        <p className='text-xs text-muted-foreground py-4 text-center'>
          Unknown artifact type:{' '}
          {(artifact as Artifact & { type: string }).type}
        </p>
      );
    }
  }
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const meta = TYPE_META[artifact.type] ?? { label: artifact.type, icon: null };
  const isGenerating = artifact.status === 'generating';
  const isFailed = artifact.status === 'failed';

  return (
    <div className='bg-background border border-border rounded-[var(--radius-card)] overflow-hidden'>
      {/* Card header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border/60'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className='text-muted-foreground flex-shrink-0'>
            {meta.icon}
          </span>
          <span className='text-sm font-semibold text-foreground truncate'>
            {artifact.title}
          </span>
        </div>
        <span
          className={`flex-shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            isGenerating
              ? 'bg-amber-100 text-amber-700 animate-pulse'
              : isFailed
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
          }`}
        >
          {isGenerating ? 'Generating\u2026' : isFailed ? 'Failed' : meta.label}
        </span>
      </div>

      {/* Card body */}
      <div className='px-4 py-3'>
        {isGenerating ? (
          <div className='flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'>
            <Loader2 className='w-4 h-4 animate-spin' />
            Generating\u2026
          </div>
        ) : isFailed ? (
          <p className='text-sm text-destructive text-center py-4'>
            Failed to generate
          </p>
        ) : (
          <ArtifactContent artifact={artifact} />
        )}
      </div>
    </div>
  );
}

interface ArtifactPanelProps {
  chatId: number;
  initialArtifacts: ArtifactsResponse | null;
}

export function ArtifactPanel({
  chatId,
  initialArtifacts,
}: ArtifactPanelProps) {
  const [artifacts, setArtifacts] = useState<ArtifactsResponse | null>(
    initialArtifacts,
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mountedRef = useRef(true);
  const pollingRef = useRef(false);

  useEffect(() => {
    pollingRef.current = true;

    const poll = async () => {
      if (!pollingRef.current || !mountedRef.current) return;

      try {
        const data = await getArtifacts(chatId);
        if (mountedRef.current) setArtifacts(data);
      } catch {
        /* keep previous data */
      }

      if (pollingRef.current && mountedRef.current) {
        setTimeout(poll, POLLING_INTERVAL_MS);
      }
    };

    const timerId = setTimeout(poll, POLLING_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      pollingRef.current = false;
      clearTimeout(timerId);
    };
  }, [chatId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getArtifacts(chatId);
      if (mountedRef.current) setArtifacts(data);
    } catch {
      /* keep */
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  };

  const items = (artifacts?.layout?.items ?? [])
    .map(item => artifacts!.artifacts[item.id])
    .filter(Boolean) as Artifact[];

  // ── Collapsed state ──────────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <CollapsedSidePanel
        label='Artifacts'
        onExpand={() => setIsCollapsed(false)}
      />
    );
  }

  // ── Open state ───────────────────────────────────────────────────────────────
  return (
    <div className='flex-1 min-w-0 flex flex-col border-r border-border bg-sidebar'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 h-[var(--topbar-height)] border-b border-border flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <Sparkles className='w-4 h-4 text-primary' />
          <span className='text-sm font-semibold text-foreground'>
            Artifacts
          </span>
          {items.length > 0 && (
            <span className='text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full'>
              {items.length}
            </span>
          )}
        </div>
        <div className='flex items-center gap-1'>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer'
            aria-label='Refresh artifacts'
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className='p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer'
            aria-label='Collapse artifacts panel'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {items.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full gap-3 text-center px-4'>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Sparkles className='w-5 h-5 text-primary' />
            </div>
            <div>
              <p className='text-sm font-medium text-foreground'>
                No artifacts yet
              </p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                Artifacts will appear here as the AI analyzes the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {items.map(artifact => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
