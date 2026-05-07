import { LayoutDashboard } from 'lucide-react';

import { ArtifactCard } from '@/entities/artifact';

import type { Artifact, ArtifactsResponse } from '@/entities/artifact';

interface Props {
  /** Pre-built artifacts from the follow-up `text` field (new backend format). */
  staticArtifacts?: ArtifactsResponse | null;
}

/**
 * Renders follow-up analysis artifacts from the follow-up `text` field.
 * @param props - Component props.
 * @param props.staticArtifacts - Pre-built artifacts from follow-up text field.
 * @returns JSX element.
 */
export default async function FollowUpAnalysis({ staticArtifacts }: Props) {
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

  return (
    <AnalysisEmptyState message='No analysis data available for this follow-up.' />
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
