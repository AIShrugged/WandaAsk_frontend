import { LayoutDashboard } from 'lucide-react';

import { ArtifactCard } from '@/entities/artifact';
import { getArtifacts } from '@/entities/artifact/api/artifacts';

import { FollowUpAnalysisPolling } from './follow-up-analysis-polling';

import type { Artifact, ArtifactsResponse } from '@/entities/artifact';

interface Props {
  /** Pre-built artifacts from the follow-up `text` field (new backend format). */
  staticArtifacts?: ArtifactsResponse | null;
  /** ID of the chat whose artifacts should be rendered (methodology chat). */
  chatId?: number | null;
}

/**
 * Renders follow-up analysis.
 *
 * Two modes:
 * 1. staticArtifacts — renders the artifacts baked into the followup `text` field directly (no polling).
 * 2. chatId — fetches artifacts from methodology chat with live polling.
 * @param props - Component props.
 * @param props.staticArtifacts - Pre-built artifacts from follow-up text field.
 * @param props.chatId - ID of the methodology configuration chat.
 * @returns JSX element.
 */
export default async function FollowUpAnalysis({
  staticArtifacts,
  chatId,
}: Props) {
  if (staticArtifacts) {
    const items = (staticArtifacts.layout?.items ?? [])
      .map((item) => {
        return staticArtifacts.artifacts[item.id];
      })
      .filter(Boolean) as Artifact[];

    if (items.length === 0) {
      return (
        <AnalysisEmptyState message='No analysis data found in this follow-up.' />
      );
    }

    return (
      <div className='flex flex-col gap-6'>
        {items.map((artifact) => {
          return <ArtifactCard key={artifact.id} artifact={artifact} />;
        })}
      </div>
    );
  }

  if (!chatId) {
    return (
      <AnalysisEmptyState message='This methodology has not been configured via chat yet. Open the AI chat and describe your evaluation criteria to get started.' />
    );
  }

  const initialArtifacts = await getArtifacts(chatId);

  return (
    <FollowUpAnalysisPolling
      chatId={chatId}
      initialArtifacts={initialArtifacts}
    />
  );
}

/**
 * AnalysisEmptyState component.
 * @param props - Component props.
 * @param props.message - Message to display.
 * @returns JSX element.
 */
function AnalysisEmptyState({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-16 gap-4 text-center'>
      <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
        <LayoutDashboard className='w-6 h-6 text-primary' />
      </div>
      <div className='max-w-sm'>
        <p className='text-sm font-medium text-foreground'>
          No analysis configured
        </p>
        <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
          {message}
        </p>
      </div>
    </div>
  );
}
