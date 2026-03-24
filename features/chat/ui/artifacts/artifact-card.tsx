'use client';

import {
  BarChart2,
  ClipboardList,
  FileCheck,
  FileText,
  Loader2,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';

import { InsightCard } from '@/features/chat/ui/artifacts/insight-card';
import { MeetingCard } from '@/features/chat/ui/artifacts/meeting-card';
import { MethodologyCriteria } from '@/features/chat/ui/artifacts/methodology-criteria';
import { PeopleList } from '@/features/chat/ui/artifacts/people-list';
import { TaskTable } from '@/features/chat/ui/artifacts/task-table';
import { TranscriptView } from '@/features/chat/ui/artifacts/transcript-view';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import type {
  Artifact,
  ArtifactType,
  ChartArtifact,
  InsightCardArtifact,
  MeetingCardArtifact,
  MethodologyCriteriaArtifact,
  PeopleListArtifact,
  TaskTableArtifact,
  TranscriptArtifact,
} from '@/features/chat/types';

// Recharts uses browser APIs (ResizeObserver) — defer to client
const ChartArtifactView = dynamic(
  () => {
    return import('@/features/chat/ui/artifacts/chart-artifact').then((m) => {
      return { default: m.ChartArtifactView };
    });
  },
  {
    ssr: false,
    // eslint-disable-next-line jsdoc/require-jsdoc
    loading: () => {
      return <Skeleton className='h-40 rounded-md' />;
    },
  },
);

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
  methodology_criteria: {
    label: 'Methodology',
    icon: <FileCheck className='w-3.5 h-3.5' />,
  },
};

/**
 * ArtifactContent component.
 * @param root0 - Component props.
 * @param root0.artifact - The artifact to render.
 * @returns JSX element.
 */
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
    case 'methodology_criteria': {
      return (
        <MethodologyCriteria
          data={(artifact as MethodologyCriteriaArtifact).data}
        />
      );
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

/**
 * ArtifactCard component.
 * @param root0 - Component props.
 * @param root0.artifact - The artifact to display as a card.
 * @returns JSX element.
 */
// eslint-disable-next-line max-statements
export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const meta = TYPE_META[artifact.type] ?? { label: artifact.type, icon: null };

  const isGenerating = artifact.status === 'generating';

  const isFailed = artifact.status === 'failed';

  let statusClassName: string;

  if (isGenerating) {
    statusClassName = 'bg-amber-100 text-amber-700 animate-pulse';
  } else if (isFailed) {
    statusClassName = 'bg-destructive/10 text-destructive';
  } else {
    statusClassName = 'bg-primary/10 text-primary';
  }

  const nonGeneratingLabel = isFailed ? 'Failed' : meta.label;

  const statusLabel = isGenerating ? 'Generating\u2026' : nonGeneratingLabel;

  let cardBody: React.ReactNode;

  if (isGenerating) {
    cardBody = (
      <div className='flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'>
        <Loader2 className='w-4 h-4 animate-spin' />
        Generating\u2026
      </div>
    );
  } else if (isFailed) {
    cardBody = (
      <p className='text-sm text-destructive text-center py-4'>
        Failed to generate
      </p>
    );
  } else {
    cardBody = <ArtifactContent artifact={artifact} />;
  }

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
          className={`flex-shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusClassName}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Card body */}
      <div className='px-4 py-3'>{cardBody}</div>
    </div>
  );
}
